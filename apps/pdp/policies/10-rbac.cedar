// Teachers can manage threads, invites, and summaries within same org.
permit(
  principal in Group::"Teacher",
  action in [Action::"CreateThread", Action::"Invite", Action::"Summarize"],
  resource in Room)
when { principal.orgId == resource.orgId };

// Analysts/Researchers may summarize (read-only power) within org.
permit(
  principal in [Group::"Analyst", Group::"Researcher"],
  action == Action::"Summarize",
  resource in Room)
when { principal.orgId == resource.orgId };

// Teachers/Analysts/Researchers can analyze files within org.
permit(
  principal in [Group::"Teacher", Group::"Analyst", Group::"Researcher"],
  action == Action::"AnalyzeFile",
  resource in File)
when { principal.orgId == resource.orgId };

// Agents can post messages in rooms within same org.
permit(
  principal is Agent,
  action == Action::"PostAsAgent",
  resource in Room)
when { principal.orgId == resource.orgId };

