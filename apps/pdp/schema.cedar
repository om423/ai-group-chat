entity User {
  orgId: String,
  roles: Set<String>
}

entity Agent {
  orgId: String,
  name: String
}

entity Room {
  orgId: String,
  members: Set<User>,
  teacherPresent: Bool
}

entity Thread {
  roomId: String,
  visibility: String
}

entity Message {
  roomId: String,
  authorId: String
}

entity File {
  roomId: String,
  classification: String
}

action CreateThread appliesTo (principal: User | Agent, resource: Room)
action Invite appliesTo (principal: User, resource: Room)
action Summarize appliesTo (principal: User | Agent, resource: Room)
action LabelMessage appliesTo (principal: User | Agent, resource: Message)
action AnalyzeFile appliesTo (principal: User | Agent, resource: File)
action PostAsAgent appliesTo (principal: Agent, resource: Room)


