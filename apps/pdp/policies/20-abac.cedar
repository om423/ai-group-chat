// Students can create PRIVATE threads in rooms where they are members.
permit(
  principal in Group::"Student",
  action == Action::"CreateThread",
  resource in Room)
when { resource.members.contains(principal) && context.visibility == "private" };

// Agents are least-privileged: Facilitator can create PUBLIC threads only if a Teacher is present.
permit(
  principal is Agent,
  action == Action::"CreateThread",
  resource in Room)
when { resource.teacherPresent == true && context.visibility == "public" };

// Labeling messages: allowed only if file/message isn't restricted for this action.
// (We'll assume classification check is passed via context.classification to keep PDP stateless.)
permit(
  principal,
  action == Action::"LabelMessage",
  resource in Message)
when { context.classification != "restricted" };

// Summarize: allow agents within org.
permit(
  principal is Agent,
  action == Action::"Summarize",
  resource in Room)
when { principal.orgId == resource.orgId };

// Students can analyze files they're members on (room member) and only if classification is not restricted.
permit(
  principal in Group::"Student",
  action == Action::"AnalyzeFile",
  resource in File)
when { context.roomMember == true && resource.classification != "restricted" };

// Only post as agent if teacherPresent (keeps the agent on a leash)
permit(
  principal is Agent,
  action == Action::"PostAsAgent",
  resource in Room)
when { resource.teacherPresent == true };

