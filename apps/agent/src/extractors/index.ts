import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import yauzl from "yauzl";

export type ExtractResult = {
  text: string;                   // normalized plain text
  perRef?: Array<{ kind: "page" | "slide" | "section" | "line"; ref: string; text: string }>;
  meta?: { pages?: number; slides?: number; size?: number };
};

export type StoredFile = { 
  id: string; 
  roomId: string; 
  orgId: string; 
  filename: string; 
  mime: string; 
  classification: string; 
  path: string; 
  size?: number 
};

export async function extractFile(sf: StoredFile): Promise<ExtractResult> {
  const ext = path.extname(sf.filename).toLowerCase();
  const mime = sf.mime.toLowerCase();

  try {
    if (mime.includes("pdf") || ext === ".pdf") {
      return await extractPDF(sf);
    } else if (mime.includes("wordprocessingml") || ext === ".docx") {
      return await extractDOCX(sf);
    } else if (mime.includes("presentationml") || ext === ".pptx") {
      return await extractPPTX(sf);
    } else if (mime.includes("spreadsheetml") || ext === ".xlsx" || ext === ".xls") {
      return await extractXLSX(sf);
    } else if (mime.includes("csv") || ext === ".csv") {
      return await extractCSV(sf);
    } else if (ext === ".txt" || ext === ".md") {
      return await extractText(sf);
    } else if (isCodeFile(ext)) {
      return await extractCode(sf);
    } else {
      return {
        text: `[Unsupported file type: ${sf.mime}]`,
        meta: { size: sf.size }
      };
    }
  } catch (error) {
    console.error(`Failed to extract ${sf.filename}:`, error);
    return {
      text: `[Failed to extract content from ${sf.filename}]`,
      meta: { size: sf.size }
    };
  }
}

async function extractPDF(sf: StoredFile): Promise<ExtractResult> {
  const buffer = fs.readFileSync(sf.path);
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  
  const text = normalizeText(data.text);
  const perRef: ExtractResult["perRef"] = [];
  
  // Split by pages if we can detect page breaks
  const pages = text.split(/\f/).filter(p => p.trim());
  pages.forEach((pageText, index) => {
    if (pageText.trim()) {
      perRef.push({
        kind: "page",
        ref: (index + 1).toString(),
        text: pageText.trim()
      });
    }
  });

  return {
    text,
    perRef,
    meta: { pages: data.numpages, size: sf.size }
  };
}

async function extractDOCX(sf: StoredFile): Promise<ExtractResult> {
  const buffer = fs.readFileSync(sf.path);
  const result = await mammoth.extractRawText({ buffer });
  
  const text = normalizeText(result.value);
  const perRef: ExtractResult["perRef"] = [];
  
  // Split by sections if we can detect them
  const sections = text.split(/\n\s*\n/).filter(s => s.trim());
  sections.forEach((sectionText, index) => {
    if (sectionText.trim()) {
      perRef.push({
        kind: "section",
        ref: (index + 1).toString(),
        text: sectionText.trim()
      });
    }
  });

  return {
    text,
    perRef,
    meta: { size: sf.size }
  };
}

async function extractPPTX(sf: StoredFile): Promise<ExtractResult> {
  return new Promise((resolve, reject) => {
    yauzl.open(sf.path, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        reject(err);
        return;
      }

      const slides: string[] = [];
      let slideCount = 0;

      zipfile.readEntry();
      zipfile.on("entry", (entry) => {
        if (entry.fileName.startsWith("ppt/slides/slide") && entry.fileName.endsWith(".xml")) {
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) {
              zipfile.readEntry();
              return;
            }

            let slideText = "";
            readStream.on("data", (chunk) => {
              slideText += chunk.toString();
            });

            readStream.on("end", () => {
              // Basic XML tag removal
              const cleanText = slideText
                .replace(/<[^>]*>/g, " ")
                .replace(/\s+/g, " ")
                .trim();
              
              if (cleanText) {
                slides.push(cleanText);
                slideCount++;
              }
              zipfile.readEntry();
            });
          });
        } else {
          zipfile.readEntry();
        }
      });

      zipfile.on("end", () => {
        const text = slides.join("\n\n");
        const perRef: ExtractResult["perRef"] = slides.map((slideText, index) => ({
          kind: "slide",
          ref: (index + 1).toString(),
          text: slideText
        }));

        resolve({
          text: normalizeText(text),
          perRef,
          meta: { slides: slideCount, size: sf.size }
        });
      });
    });
  });
}

async function extractXLSX(sf: StoredFile): Promise<ExtractResult> {
  const buffer = fs.readFileSync(sf.path);
  const workbook = XLSX.read(buffer);
  
  const sheets: string[] = [];
  const perRef: ExtractResult["perRef"] = [];

  workbook.SheetNames.forEach((sheetName, index) => {
    const worksheet = workbook.Sheets[sheetName];
    const sheetData = XLSX.utils.sheet_to_txt(worksheet);
    
    if (sheetData.trim()) {
      sheets.push(`Sheet: ${sheetName}\n${sheetData}`);
      perRef.push({
        kind: "section",
        ref: sheetName,
        text: sheetData.trim()
      });
    }
  });

  return {
    text: normalizeText(sheets.join("\n\n")),
    perRef,
    meta: { size: sf.size }
  };
}

async function extractCSV(sf: StoredFile): Promise<ExtractResult> {
  const text = fs.readFileSync(sf.path, "utf-8");
  const lines = text.split("\n").slice(0, 50); // First 50 lines
  
  return {
    text: normalizeText(lines.join("\n")),
    meta: { size: sf.size }
  };
}

async function extractText(sf: StoredFile): Promise<ExtractResult> {
  const text = fs.readFileSync(sf.path, "utf-8");
  
  // For markdown, remove links and images
  const cleanText = sf.filename.endsWith(".md") 
    ? text.replace(/!\[.*?\]\(.*?\)/g, "").replace(/\[.*?\]\(.*?\)/g, "$1")
    : text;

  return {
    text: normalizeText(cleanText),
    meta: { size: sf.size }
  };
}

async function extractCode(sf: StoredFile): Promise<ExtractResult> {
  const text = fs.readFileSync(sf.path, "utf-8");
  const language = getLanguageFromExtension(path.extname(sf.filename));
  
  // Limit to first 8000 characters for code files
  const limitedText = text.slice(0, 8000);
  
  return {
    text: normalizeText(`[${language} code]\n${limitedText}`),
    meta: { size: sf.size }
  };
}

function normalizeText(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove non-printables
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

function isCodeFile(ext: string): boolean {
  const codeExts = [".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".cpp", ".c", ".h", ".cs", ".php", ".rb", ".go", ".rs", ".swift", ".kt", ".scala", ".sh", ".bash", ".zsh", ".fish", ".ps1", ".bat", ".yml", ".yaml", ".json", ".xml", ".html", ".css", ".scss", ".sass", ".less", ".sql", ".r", ".m", ".pl", ".lua", ".dart", ".elm", ".clj", ".hs", ".ml", ".fs", ".vb", ".asm", ".s", ".tex", ".rkt", ".jl", ".nim", ".cr", ".ex", ".exs", ".erl", ".hrl", ".fsx", ".fsscript", ".fsi", ".fsproj", ".csproj", ".sln", ".vcxproj", ".vcproj", ".dsp", ".dsw", ".ncb", ".suo", ".user", ".aps", ".clw", ".opt", ".plg", ".bsc", ".sbr", ".pdb", ".ilk", ".exp", ".lib", ".obj", ".res", ".rc", ".rc2", ".def", ".odl", ".idl", ".tlb", ".tlh", ".reg", ".bat", ".cmd", ".com", ".exe", ".dll", ".ocx", ".sys", ".drv", ".vxd", ".386", ".pif", ".scr", ".cpl", ".msc", ".msi", ".msp", ".mst", ".cab", ".inf", ".cat", ".chm", ".hlp", ".cnt", ".rtf", ".wri", ".doc", ".dot", ".xls", ".xlt", ".ppt", ".pot", ".wav", ".mid", ".avi", ".mpg", ".mpeg", ".mov", ".qt", ".asf", ".wmv", ".mp3", ".mp4", ".m4a", ".m4v", ".3gp", ".3g2", ".flv", ".webm", ".ogg", ".ogv", ".oga", ".spx", ".opus", ".aac", ".wma", ".flac", ".alac", ".ape", ".wv", ".tta", ".tak", ".ofr", ".ofs", ".ofc", ".rka", ".aa", ".aax", ".act", ".aiff", ".au", ".awb", ".dct", ".dss", ".dvf", ".gsm", ".iklax", ".ivs", ".m4a", ".mmf", ".mp3", ".mpc", ".msv", ".nmf", ".ogg", ".oga", ".mogg", ".opus", ".ra", ".rm", ".raw", ".rf64", ".sln", ".tta", ".voc", ".vox", ".wav", ".wma", ".wv", ".webm", ".8svx", ".cda", ".dts", ".flac", ".m4a", ".m4b", ".m4p", ".m4r", ".mp3", ".mp4", ".mpc", ".oga", ".ogg", ".opus", ".ra", ".rm", ".tta", ".wav", ".wma", ".wv"];
  return codeExts.includes(ext.toLowerCase());
}

function getLanguageFromExtension(ext: string): string {
  const langMap: Record<string, string> = {
    ".js": "JavaScript",
    ".ts": "TypeScript", 
    ".jsx": "React JSX",
    ".tsx": "React TSX",
    ".py": "Python",
    ".java": "Java",
    ".cpp": "C++",
    ".c": "C",
    ".h": "C Header",
    ".cs": "C#",
    ".php": "PHP",
    ".rb": "Ruby",
    ".go": "Go",
    ".rs": "Rust",
    ".swift": "Swift",
    ".kt": "Kotlin",
    ".scala": "Scala",
    ".sh": "Shell",
    ".bash": "Bash",
    ".zsh": "Zsh",
    ".fish": "Fish",
    ".ps1": "PowerShell",
    ".bat": "Batch",
    ".yml": "YAML",
    ".yaml": "YAML",
    ".json": "JSON",
    ".xml": "XML",
    ".html": "HTML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".sass": "Sass",
    ".less": "Less",
    ".sql": "SQL",
    ".r": "R",
    ".m": "MATLAB",
    ".pl": "Perl",
    ".lua": "Lua",
    ".dart": "Dart",
    ".elm": "Elm",
    ".clj": "Clojure",
    ".hs": "Haskell",
    ".ml": "OCaml",
    ".fs": "F#",
    ".vb": "Visual Basic",
    ".asm": "Assembly",
    ".s": "Assembly",
    ".tex": "LaTeX",
    ".rkt": "Racket",
    ".jl": "Julia",
    ".nim": "Nim",
    ".cr": "Crystal",
    ".ex": "Elixir",
    ".exs": "Elixir Script",
    ".erl": "Erlang",
    ".hrl": "Erlang Header",
    ".fsx": "F# Script",
    ".fsscript": "F# Script",
    ".fsi": "F# Interface",
    ".fsproj": "F# Project",
    ".csproj": "C# Project",
    ".sln": "Visual Studio Solution",
    ".vcxproj": "Visual C++ Project",
    ".vcproj": "Visual C++ Project",
    ".dsp": "Visual C++ Workspace",
    ".dsw": "Visual C++ Workspace",
    ".ncb": "Visual C++ IntelliSense",
    ".suo": "Visual Studio User Options",
    ".user": "Visual Studio User File",
    ".aps": "Visual C++ Resource",
    ".clw": "Visual C++ ClassWizard",
    ".opt": "Visual C++ Options",
    ".plg": "Visual C++ Build Log",
    ".bsc": "Visual C++ Browse Info",
    ".sbr": "Visual C++ Source Browser",
    ".pdb": "Program Database",
    ".ilk": "Incremental Link File",
    ".exp": "Export File",
    ".lib": "Static Library",
    ".obj": "Object File",
    ".res": "Resource File",
    ".rc": "Resource Script",
    ".rc2": "Resource Script",
    ".def": "Module Definition",
    ".odl": "Object Description Language",
    ".idl": "Interface Definition Language",
    ".tlb": "Type Library",
    ".tlh": "Type Library Header",
    ".reg": "Registry File",
    ".bat": "Batch File",
    ".cmd": "Command File",
    ".com": "Command File",
    ".exe": "Executable",
    ".dll": "Dynamic Link Library",
    ".ocx": "ActiveX Control",
    ".sys": "System File",
    ".drv": "Driver File",
    ".vxd": "Virtual Device Driver",
    ".386": "Virtual Device Driver",
    ".pif": "Program Information File",
    ".scr": "Screen Saver",
    ".cpl": "Control Panel Applet",
    ".msc": "Microsoft Management Console",
    ".msi": "Windows Installer Package",
    ".msp": "Windows Installer Patch",
    ".mst": "Windows Installer Transform",
    ".cab": "Cabinet File",
    ".inf": "Setup Information",
    ".cat": "Security Catalog",
    ".chm": "Compiled HTML Help",
    ".hlp": "Help File",
    ".cnt": "Help Contents",
    ".rtf": "Rich Text Format",
    ".wri": "Write Document",
    ".doc": "Word Document",
    ".dot": "Word Template",
    ".xls": "Excel Spreadsheet",
    ".xlt": "Excel Template",
    ".ppt": "PowerPoint Presentation",
    ".pot": "PowerPoint Template",
    ".wav": "Wave Audio",
    ".mid": "MIDI Audio",
    ".avi": "Audio Video Interleave",
    ".mpg": "MPEG Video",
    ".mpeg": "MPEG Video",
    ".mov": "QuickTime Movie",
    ".qt": "QuickTime Movie",
    ".asf": "Advanced Systems Format",
    ".wmv": "Windows Media Video",
    ".mp3": "MP3 Audio",
    ".mp4": "MP4 Video",
    ".m4a": "MP4 Audio",
    ".m4v": "MP4 Video",
    ".3gp": "3GPP Video",
    ".3g2": "3GPP2 Video",
    ".flv": "Flash Video",
    ".webm": "WebM Video",
    ".ogg": "Ogg Vorbis",
    ".ogv": "Ogg Video",
    ".oga": "Ogg Audio",
    ".spx": "Speex Audio",
    ".opus": "Opus Audio",
    ".aac": "AAC Audio",
    ".wma": "Windows Media Audio",
    ".flac": "Free Lossless Audio Codec",
    ".alac": "Apple Lossless Audio Codec",
    ".ape": "Monkey's Audio",
    ".wv": "WavPack",
    ".tta": "True Audio",
    ".tak": "Tom's lossless Audio Kompressor",
    ".ofr": "OptimFROG",
    ".ofs": "OptimFROG",
    ".ofc": "OptimFROG",
    ".rka": "RKAU",
    ".aa": "Audible Audio",
    ".aax": "Audible Enhanced Audio",
    ".act": "ACT Audio",
    ".aiff": "Audio Interchange File Format",
    ".au": "Audio File",
    ".awb": "Adaptive Multi-Rate Wideband",
    ".dct": "NCH Software",
    ".dss": "Digital Speech Standard",
    ".dvf": "Sony Digital Voice",
    ".gsm": "Global System for Mobile",
    ".iklax": "iKlax Media",
    ".ivs": "3GPP",
    ".m4a": "MP4 Audio",
    ".mmf": "Samsung Audio",
    ".mp3": "MP3 Audio",
    ".mpc": "Musepack",
    ".msv": "Sony Memory Stick",
    ".nmf": "Nokia Audio",
    ".ogg": "Ogg Vorbis",
    ".oga": "Ogg Audio",
    ".mogg": "Ogg Media",
    ".opus": "Opus Audio",
    ".ra": "Real Audio",
    ".rm": "Real Media",
    ".raw": "Raw Audio",
    ".rf64": "RF64 Audio",
    ".sln": "Sony Audio",
    ".tta": "True Audio",
    ".voc": "Creative Voice",
    ".vox": "Dialogic Audio",
    ".wav": "Wave Audio",
    ".wma": "Windows Media Audio",
    ".wv": "WavPack",
    ".webm": "WebM Audio",
    ".8svx": "8SVX Audio",
    ".cda": "CD Audio",
    ".dts": "DTS Audio",
    ".flac": "Free Lossless Audio Codec",
    ".m4a": "MP4 Audio",
    ".m4b": "MP4 Audio Book",
    ".m4p": "MP4 Protected Audio",
    ".m4r": "MP4 Ringtone",
    ".mp3": "MP3 Audio",
    ".mp4": "MP4 Audio",
    ".mpc": "Musepack",
    ".oga": "Ogg Audio",
    ".ogg": "Ogg Vorbis",
    ".opus": "Opus Audio",
    ".ra": "Real Audio",
    ".rm": "Real Media",
    ".tta": "True Audio",
    ".wav": "Wave Audio",
    ".wma": "Windows Media Audio",
    ".wv": "WavPack"
  };
  
  return langMap[ext.toLowerCase()] || "Unknown";
}
