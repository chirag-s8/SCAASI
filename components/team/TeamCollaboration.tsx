"use client";

import { useState, useEffect } from "react";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "pending";
  activeTasksCount: number;
  responseRate: number;
};

type AssignedEmail = {
  emailId: string;
  assignedTo: string;
  assignedBy: string;
  deadline?: string;
  status: "assigned" | "in-progress" | "waiting-on-client" | "completed";
  notes: { text: string; author: string; timestamp: number }[];
  priority: number;
};

type TeamGroup = {
  id: string;
  name: string;
  members: string[]; // member IDs
  notes: { text: string; author: string; timestamp: number; isAi?: boolean }[];
};

type Props = {
  onEmailClick?: (id: string) => void;
};

const DEFAULT_TEAM: TeamMember[] = [
  { id: "me", name: "You (Admin)", email: "admin@scasi.ai", role: "Admin", status: "active", activeTasksCount: 0, responseRate: 100 },
];

export default function TeamCollaboration({ onEmailClick }: Props) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "assignments" | "members" | "groups">("groups");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [assignedEmails, setAssignedEmails] = useState<AssignedEmail[]>([]);
  const [teamGroups, setTeamGroups] = useState<TeamGroup[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Member Invite State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("Member");
  const [inviting, setInviting] = useState(false);

  // Group Create State
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupMembers, setNewGroupMembers] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<TeamGroup | null>(null);
  const [groupNote, setGroupNote] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [quickInviteEmail, setQuickInviteEmail] = useState("");

  // Group Task Assignment State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskAssignTo, setNewTaskAssignTo] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");

  const loadData = () => {
    const tm = localStorage.getItem("scasi_team_members");
    const te = localStorage.getItem("scasi_team_tasks");
    const tg = localStorage.getItem("scasi_team_groups");
    
    if (tm) setTeamMembers(JSON.parse(tm));
    else {
      setTeamMembers(DEFAULT_TEAM);
      localStorage.setItem("scasi_team_members", JSON.stringify(DEFAULT_TEAM));
    }
    if (te) setAssignedEmails(JSON.parse(te));
    if (tg) setTeamGroups(JSON.parse(tg));
  };

  useEffect(() => {
    loadData();
    setLoading(false);
    
    const handleSync = () => loadData();
    window.addEventListener("teamSync", handleSync);
    return () => window.removeEventListener("teamSync", handleSync);
  }, []);

  const saveTasks = (newTasks: AssignedEmail[]) => {
    setAssignedEmails(newTasks);
    localStorage.setItem("scasi_team_tasks", JSON.stringify(newTasks));
    window.dispatchEvent(new Event("teamSync"));
  };

  const saveMembers = (newMembers: TeamMember[]) => {
    setTeamMembers(newMembers);
    localStorage.setItem("scasi_team_members", JSON.stringify(newMembers));
    window.dispatchEvent(new Event("teamSync"));
  };

  const saveGroups = (newGroups: TeamGroup[]) => {
    setTeamGroups(newGroups);
    localStorage.setItem("scasi_team_groups", JSON.stringify(newGroups));
    window.dispatchEvent(new Event("teamSync"));
  };

  const executeInviteApi = async (email: string, name: string) => {
    try {
      fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
    } catch(e) {}
  };

  const handleInvite = async () => {
    if (!inviteEmail) return alert("Email is required!");
    setInviting(true);
    await executeInviteApi(inviteEmail, inviteName);
    
    const newMember: TeamMember = {
      id: "usr_" + Date.now(),
      name: inviteName || inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: "pending",
      activeTasksCount: 0,
      responseRate: 100
    };
    saveMembers([...teamMembers, newMember]);
    setInviteEmail(""); setInviteName(""); setInviteRole("Member");
    alert("Invitation sent successfully!");
    setInviting(false);
  };

  const handleQuickInviteToGroup = async () => {
    if (!quickInviteEmail) return;
    
    // Check if member already exists in global squad
    let existingId = teamMembers.find(m => m.email.toLowerCase() === quickInviteEmail.toLowerCase())?.id;
    let finalMembers = [...teamMembers];
    
    if (!existingId) {
      executeInviteApi(quickInviteEmail, quickInviteEmail.split('@')[0]);
      existingId = "usr_" + Date.now();
      const newMember: TeamMember = {
        id: existingId,
        name: quickInviteEmail.split('@')[0],
        email: quickInviteEmail,
        role: "Member",
        status: "pending",
        activeTasksCount: 0,
        responseRate: 100
      };
      finalMembers.push(newMember);
      saveMembers(finalMembers);
    }
    
    setNewGroupMembers([...newGroupMembers, existingId]);
    setQuickInviteEmail("");
  };

  const handleAddMemberToActiveGroup = () => {
    const rawEmail = window.prompt("Enter the email of the person you want to invite to this specific Project Group:");
    if (!rawEmail || !selectedGroup) return;
    
    const email = rawEmail.trim();
    let existingId = teamMembers.find(m => m.email.toLowerCase() === email.toLowerCase())?.id;
    let finalMembers = [...teamMembers];
    
    if (!existingId) {
      executeInviteApi(email, email.split('@')[0]);
      existingId = "usr_" + Date.now();
      const newMember: TeamMember = {
        id: existingId,
        name: email.split('@')[0],
        email: email,
        role: "Member",
        status: "pending",
        activeTasksCount: 0,
        responseRate: 100
      };
      finalMembers.push(newMember);
      saveMembers(finalMembers);
    }
    
    if (!selectedGroup.members.includes(existingId)) {
      const updatedGroup = { ...selectedGroup, members: [...selectedGroup.members, existingId] };
      saveGroups(teamGroups.map(g => g.id === updatedGroup.id ? updatedGroup : g));
      setSelectedGroup(updatedGroup);
    } else {
      alert("This person is already in the group!");
    }
  }

  const updateTaskStatus = (emailId: string, newStatus: any) => {
    const updated = assignedEmails.map(t => t.emailId === emailId ? { ...t, status: newStatus } : t);
    saveTasks(updated);
  };

  const handleCreateGroup = () => {
    if (!newGroupName) return alert("Please name your team project.");
    if (newGroupMembers.length === 0) return alert("Please select at least one member or invite via email.");
    
    const finalMembers = newGroupMembers.includes("me") ? newGroupMembers : ["me", ...newGroupMembers];
    
    const newGroup: TeamGroup = {
      id: "grp_" + Date.now(),
      name: newGroupName,
      members: finalMembers,
      notes: [{ text: `Welcome to the ${newGroupName} project team! You can type @ai to ask Scasi questions.`, author: "System", timestamp: Date.now(), isAi: true }]
    };
    
    saveGroups([newGroup, ...teamGroups]);
    setNewGroupName("");
    setNewGroupMembers([]);
    setSelectedGroup(newGroup);
  };

  const handleSendGroupNote = () => {
    if (!groupNote.trim() || !selectedGroup) return;
    
    const isAiTarget = groupNote.toLowerCase().includes("@ai");
    const updatedGroup = { 
      ...selectedGroup, 
      notes: [...selectedGroup.notes, { text: groupNote, author: "You", timestamp: Date.now() }]
    };
    
    const updatedGroups = teamGroups.map(g => g.id === selectedGroup.id ? updatedGroup : g);
    saveGroups(updatedGroups);
    setSelectedGroup(updatedGroup);
    setGroupNote("");

    if (isAiTarget) {
      setAiTyping(true);
      setTimeout(() => {
        const aiResponse = { text: `AI: I've analyzed the team workload for ${updatedGroup.name}. Let me know if you need me to draft follow-ups or generate a summary of our progress!`, author: "Scasi AI", timestamp: Date.now(), isAi: true };
        const finalGroup = { ...updatedGroup, notes: [...updatedGroup.notes, aiResponse] };
        saveGroups(teamGroups.map(g => g.id === finalGroup.id ? finalGroup : g));
        setSelectedGroup(finalGroup);
        setAiTyping(false);
      }, 1500);
    }
  };

  const handleAssignGroupTask = () => {
    if (!newTaskDesc || !newTaskAssignTo) return;
    const task: AssignedEmail = {
      emailId: "task_" + Date.now() + "_" + Math.floor(Math.random()*1000),
      assignedTo: newTaskAssignTo,
      assignedBy: "me",
      status: "assigned",
      priority: 50,
      notes: [{ text: newTaskDesc, author: "You", timestamp: Date.now() }]
    };
    saveTasks([task, ...assignedEmails]);
    setShowTaskModal(false);
    setNewTaskDesc("");
  };

  if (loading) return null;

  const totalPending = assignedEmails.filter(e => e.status !== "completed").length;
  const avgResponseRate = teamMembers.reduce((sum, m) => sum + m.responseRate, 0) / (teamMembers.length || 1);

  return (
    <div style={{ padding: "32px 40px", background: "#FAF8FF", minHeight: "100%", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .team-tab { transition: all 0.2s; position: relative; }
        .team-tab:hover { color: #7C3AED !important; }
        .team-tab.active::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 3px; background: #7C3AED; border-radius: 3px 3px 0 0; }
        .team-card { transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .team-card:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(124,58,237,0.06); border-color: rgba(124,58,237,0.3); }
        .badge { padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .badge-assigned { background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; }
        .badge-in-progress { background: #FFFBEB; color: #D97706; border: 1px solid #FDE68A; }
        .badge-waiting-on-client { background: #F5F3FF; color: #7C3AED; border: 1px solid #DDD6FE; }
        .badge-completed { background: #F0FDF4; color: #059669; border: 1px solid #BBF7D0; }
        
        .chat-scroll::-webkit-scrollbar { width: 6px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.2); border-radius: 10px; }
      `}</style>

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: "#18103A", letterSpacing: "-0.5px", marginBottom: 4 }}>
          👥 Team Symphony
        </h2>
        <p style={{ color: "#7a72a8", fontSize: 14 }}>Manage your global squad, create WhatsApp-style project teams, and balance workloads in real-time.</p>
      </div>

      <div style={{ display: "flex", gap: 32, marginBottom: 32, borderBottom: "2px solid #E2D9F3" }}>
        {[
          { id: "dashboard", label: "📊 Mission Control" },
          { id: "groups", label: "🚀 Project Groups" },
          { id: "assignments", label: "📋 Shared Workspace" },
          { id: "members", label: "👥 Squad & Roles" },
        ].map(tab => (
          <button
            key={tab.id}
            className={`team-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => { setActiveTab(tab.id as any); setSelectedGroup(null); }}
            style={{
              padding: "12px 16px", background: "transparent", border: "none",
              fontSize: 14, fontWeight: activeTab === tab.id ? 800 : 600,
              color: activeTab === tab.id ? "#7C3AED" : "#7a72a8", cursor: "pointer"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "groups" && (
        <div className="anim">
          {!selectedGroup ? (
            <div style={{ display: "flex", gap: 32 }}>
              
              {/* MAKE TEAM FORM */}
              <div style={{ flex: 1 }}>
                <div className="team-card" style={{ padding: 32, borderRadius: 24, background: "white", border: "1px solid #E2D9F3" }}>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: "#18103A", marginBottom: 6 }}>Make Team</h3>
                  <p style={{ fontSize: 13, color: "#7a72a8", marginBottom: 24 }}>Create a dedicated workspace. Invite people instantly by typing their email.</p>
                  
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 800, color: "#4C1D95", textTransform: "uppercase", marginBottom: 8, display: "block" }}>Project Name</label>
                    <input 
                      value={newGroupName} onChange={e => setNewGroupName(e.target.value)} 
                      placeholder="e.g., Q4 Marketing Launch" 
                      style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "2px solid #E2D9F3", fontSize: 15, outline: "none", fontWeight: 600, color: "#18103A" }} 
                      autoFocus
                    />
                  </div>
                  
                  <div style={{ marginBottom: 24, padding: "16px", background: "#F5F3FF", borderRadius: 16, border: "1px dashed #A78BFA" }}>
                    <label style={{ fontSize: 12, fontWeight: 800, color: "#7C3AED", textTransform: "uppercase", marginBottom: 8, display: "block", display: "flex", alignItems: "center", gap: 6 }}>
                      <span>✉️</span> Instant Invite by Email
                    </label>
                    <div style={{ display: "flex", gap: 10 }}>
                      <input 
                        value={quickInviteEmail} onChange={e => setQuickInviteEmail(e.target.value)} 
                        onKeyDown={e => e.key === "Enter" && handleQuickInviteToGroup()}
                        placeholder="collaborator@example.com" 
                        style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: "1px solid #E2D9F3", fontSize: 13, outline: "none" }} 
                      />
                      <button onClick={handleQuickInviteToGroup} style={{ padding: "0 16px", borderRadius: 10, background: "#7C3AED", color: "white", fontWeight: 800, border: "none", cursor: "pointer" }}>Add</button>
                    </div>
                    <div style={{ fontSize: 10, color: "#7a72a8", marginTop: 8 }}>
                      *Hitting "Add" will securely generate an invite email and link them straight to this group.
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 12, fontWeight: 800, color: "#18103A", textTransform: "uppercase", marginBottom: 8, display: "block" }}>Or Pick from Squad ({newGroupMembers.length} in group)</label>
                    <div style={{ maxHeight: 150, overflowY: "auto", border: "1px solid #E2D9F3", borderRadius: 12, padding: 8 }}>
                      {teamMembers.map(m => (
                         <div 
                           key={m.id} 
                           onClick={() => {
                             if(newGroupMembers.includes(m.id)) setNewGroupMembers(newGroupMembers.filter(id => id !== m.id));
                             else setNewGroupMembers([...newGroupMembers, m.id]);
                           }}
                           style={{ padding: "10px 14px", borderRadius: 8, background: newGroupMembers.includes(m.id) ? "#F5F3FF" : "transparent", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: 4 }}
                         >
                           <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                             <div style={{ width: 32, height: 32, borderRadius: 8, background: "#7C3AED", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>{m.name.charAt(0)}</div>
                             <div>
                               <div style={{ fontSize: 13, fontWeight: 800, color: "#18103A", display: "flex", gap: 6, alignItems: "center" }}>
                                  {m.name}
                                  {m.status === 'pending' && <span style={{ fontSize: 9, background: "#FFFBEB", color: "#D97706", padding: "2px 6px", borderRadius: 4 }}>INVITED</span>}
                               </div>
                               <div style={{ fontSize: 11, color: "#A78BFA" }}>{m.email}</div>
                             </div>
                           </div>
                           <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${newGroupMembers.includes(m.id) ? "#7C3AED" : "#E2D9F3"}`, background: newGroupMembers.includes(m.id) ? "#7C3AED" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                             {newGroupMembers.includes(m.id) && <span style={{ color: "white", fontSize: 12 }}>✓</span>}
                           </div>
                         </div>
                      ))}
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleCreateGroup}
                    style={{ width: "100%", padding: "14px", borderRadius: 12, background: "linear-gradient(135deg, #7C3AED, #4F46E5)", color: "white", fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer", boxShadow: "0 8px 20px rgba(124,58,237,0.3)" }}
                  >
                    🚀 Launch Project Team
                  </button>
                </div>
              </div>

              {/* GROUPS LIST */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                {teamGroups.length === 0 && (
                  <div style={{ padding: 40, textAlign: "center", color: "#A78BFA", fontSize: 15, fontWeight: 600, border: "2px dashed #E2D9F3", borderRadius: 24 }}>
                    You have no active project teams. Create one to get started!
                  </div>
                )}
                {teamGroups.map(group => (
                  <div 
                    key={group.id} 
                    className="team-card" 
                    onClick={() => setSelectedGroup(group)}
                    style={{ padding: 24, borderRadius: 20, background: "white", border: "1px solid #E2D9F3", cursor: "pointer", display: "flex", flexDirection: "column", gap: 16 }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h4 style={{ fontSize: 18, fontWeight: 800, color: "#18103A", marginBottom: 4 }}>{group.name}</h4>
                        <div style={{ fontSize: 12, color: "#7a72a8", fontWeight: 600 }}>{group.members.length} Members Collaborating</div>
                      </div>
                      <div style={{ padding: "6px 12px", background: "#F5F3FF", color: "#7C3AED", borderRadius: 8, fontSize: 11, fontWeight: 800, letterSpacing: 0.5 }}>ACTIVE GROUP</div>
                    </div>
                    
                    <div style={{ display: "flex", position: "relative" }}>
                      {group.members.slice(0, 5).map((mId, i) => {
                        const m = teamMembers.find(t => t.id === mId);
                        return m ? (
                          <div key={i} title={m.name} style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #A78BFA, #4C1D95)", border: "2px solid white", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, marginLeft: i === 0 ? 0 : -10, zIndex: 10 - i }}>
                            {m.name.charAt(0)}
                          </div>
                        ) : null;
                      })}
                      {group.members.length > 5 && (
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#F5F3FF", border: "2px solid white", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, marginLeft: -10, zIndex: 0 }}>
                          +{group.members.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            
            /* ════ GROUP DETAIL VIEW ════ */
            <div style={{ display: "flex", gap: 24, height: 600 }} className="anim">
              
              {/* CHAT / NOTES SECTION (60%) */}
              <div style={{ flex: 1.5, background: "white", borderRadius: 24, border: "1px solid #E2D9F3", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ padding: "18px 24px", background: "linear-gradient(135deg, #7C3AED, #4F46E5)", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <button onClick={() => setSelectedGroup(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>←</button>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{selectedGroup.name}</h3>
                      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Team Chat & AI Hub</div>
                    </div>
                  </div>
                  <button onClick={handleAddMemberToActiveGroup} style={{ background: "white", border: "none", color: "#7C3AED", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 12 }}>
                    + Invite By Email
                  </button>
                </div>
                
                <div className="chat-scroll" style={{ flex: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, background: "#FAF8FF" }}>
                  {selectedGroup.notes.map((note, i) => {
                    const isMe = note.author === "You";
                    const isAi = note.isAi;
                    return (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", opacity: 0, animation: "fadeIn 0.3s forwards" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", marginBottom: 4, padding: "0 4px" }}>
                          {isAi ? "🤖 Scasi AI" : note.author} · {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ 
                          padding: "12px 16px", borderRadius: isMe ? "16px 16px 0 16px" : "16px 16px 16px 0",
                          background: isMe ? "#7C3AED" : isAi ? "linear-gradient(135deg, #4C1D95, #312E81)" : "white",
                          color: isMe || isAi ? "white" : "#18103A",
                          fontSize: 14, lineHeight: 1.5,
                          border: (!isMe && !isAi) ? "1px solid #E2D9F3" : "none",
                          boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
                          maxWidth: "85%"
                        }}>
                          {note.text}
                        </div>
                      </div>
                    );
                  })}
                  {aiTyping && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", marginBottom: 4, padding: "0 4px" }}>🤖 Scasi AI</div>
                      <div style={{ padding: "12px 16px", borderRadius: "16px 16px 16px 0", background: "white", fontSize: 14, color: "#18103A", border: "1px solid #E2D9F3" }}>
                        Thinking...
                      </div>
                    </div>
                  )}
                </div>
                
                <div style={{ padding: 20, background: "white", borderTop: "1px solid #E2D9F3", display: "flex", gap: 12 }}>
                  <input 
                    value={groupNote} onChange={e => setGroupNote(e.target.value)} 
                    onKeyDown={e => e.key === "Enter" && handleSendGroupNote()}
                    placeholder="Type @ai to ask Scasi questions, or chat with the team..." 
                    style={{ flex: 1, padding: "14px 16px", borderRadius: 12, border: "1px solid #E2D9F3", fontSize: 14, outline: "none", background: "#FAF8FF" }} 
                  />
                  <button onClick={handleSendGroupNote} style={{ padding: "0 24px", borderRadius: 12, background: "#18103A", color: "white", fontWeight: 800, border: "none", cursor: "pointer" }}>Send</button>
                </div>
              </div>
              
              {/* GROUP DASHBOARD & TASKS SECTION (40%) */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: "white", borderRadius: 24, border: "1px solid #E2D9F3", padding: 24 }}>
                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                     <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#18103A" }}>👀 Burnout Monitor</h4>
                   </div>
                   <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, maxHeight: 220, overflowY: "auto", paddingRight: 4 }} className="chat-scroll">
                     {selectedGroup.members.map(mId => {
                       const member = teamMembers.find(m => m.id === mId);
                       if (!member) return null;
                       const tasks = assignedEmails.filter(t => t.assignedTo === mId && t.status !== "completed").length;
                       return (
                         <div key={mId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#FAF8FF", borderRadius: 12, border: "1px solid #E2D9F3" }}>
                           <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                             <div style={{ width: 28, height: 28, borderRadius: 8, background: "#7C3AED", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{member.name.charAt(0)}</div>
                             <div>
                               <div style={{ fontSize: 12, fontWeight: 800, color: "#18103A" }}>{member.name}</div>
                               <div style={{ fontSize: 10, color: "#7a72a8", fontWeight: 600 }}>{tasks} active tasks</div>
                             </div>
                           </div>
                           <div style={{ width: 24, height: 24 }}>
                             <svg viewBox="0 0 36 36"><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2D9F3" strokeWidth="4" /><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={tasks > 4 ? "#EF4444" : "#10B981"} strokeWidth="4" strokeDasharray={`${Math.min(100, tasks * 20)}, 100`} /></svg>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                </div>

                <div style={{ background: "white", borderRadius: 24, border: "1px solid #E2D9F3", padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                     <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#18103A" }}>🚀 Group Tasks</h4>
                     <button onClick={() => setShowTaskModal(true)} style={{ background: "#F5F3FF", border: "none", color: "#7C3AED", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 12 }}>+ Assign</button>
                   </div>
                   
                   {showTaskModal && (
                     <div className="anim" style={{ background: "#FAF8FF", padding: 16, borderRadius: 16, border: "1px dashed #A78BFA", marginBottom: 16 }}>
                       <input value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} placeholder="Task description..." style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #E2D9F3", marginBottom: 10, fontSize: 13, outline: "none" }} />
                       <select value={newTaskAssignTo} onChange={e => setNewTaskAssignTo(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #E2D9F3", marginBottom: 10, fontSize: 13, outline: "none", fontWeight: 600 }}>
                         <option value="">Select Assignee</option>
                         {selectedGroup.members.map(mId => {
                           const m = teamMembers.find(t => t.id === mId);
                           return m ? <option key={m.id} value={m.id}>{m.name}</option> : null;
                         })}
                       </select>
                       <div style={{ display: "flex", gap: 8 }}>
                         <button onClick={handleAssignGroupTask} style={{ flex: 1, padding: "8px", background: "#7C3AED", color: "white", borderRadius: 8, border: "none", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Assign</button>
                         <button onClick={() => setShowTaskModal(false)} style={{ flex: 1, padding: "8px", background: "white", color: "#18103A", borderRadius: 8, border: "1px solid #E2D9F3", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Cancel</button>
                       </div>
                     </div>
                   )}
                   
                   <div className="chat-scroll" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", paddingRight: 4 }}>
                     {assignedEmails.filter(t => selectedGroup.members.includes(t.assignedTo)).length === 0 && !showTaskModal && (
                       <div style={{ fontSize: 12, color: "#A78BFA", textAlign: "center", padding: 20 }}>No tasks currently tracked for this group.</div>
                     )}
                     {assignedEmails.filter(t => selectedGroup.members.includes(t.assignedTo)).map(task => {
                       const m = teamMembers.find(mm => mm.id === task.assignedTo);
                       return (
                         <div key={task.emailId} style={{ padding: 12, borderRadius: 12, border: "1px solid #E2D9F3", background: "white" }}>
                           <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                             <span className={`badge badge-${task.status}`} style={{ fontSize: 9 }}>{task.status.replace("-", " ")}</span>
                             <span style={{ fontSize: 10, fontWeight: 800, color: "#7a72a8" }}>Priority {task.priority}</span>
                           </div>
                           <div style={{ fontSize: 13, fontWeight: 800, color: "#18103A", marginBottom: 6 }}>{task.notes[0]?.text || "Task: " + task.emailId.substring(0,8)}</div>
                           <div style={{ fontSize: 11, color: "#7a72a8", display: "flex", gap: 6, alignItems: "center" }}>
                             <div style={{ width: 16, height: 16, borderRadius: 4, background: "#7C3AED", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800 }}>{m?.name.charAt(0)}</div>
                             <span>{m?.name}</span>
                           </div>
                         </div>
                       )
                     })}
                   </div>
                </div>

              </div>
            </div>
          )}
          
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
      )}

      {/* DASHBOARD TAB */}
      {activeTab === "dashboard" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 32 }}>
            <MetricCard title="Shared Tasks Pending" value={totalPending} icon="🎯" gradient="linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)" />
            <MetricCard title="Avg Response Rate" value={`${avgResponseRate.toFixed(0)}%`} icon="🚀" gradient="linear-gradient(135deg, #84FAB0 0%, #8FD3F4 100%)" />
            <MetricCard title="Squad Members" value={teamMembers.length} icon="🧑‍🤝‍🧑" gradient="linear-gradient(135deg, #A8EDEA 0%, #FED6E3 100%)" />
          </div>

          <div style={{ display: "flex", gap: 24 }}>
             <div style={{ flex: 2, background: "white", padding: 32, borderRadius: 24, border: "1px solid #E2D9F3", boxShadow: "0 8px 30px rgba(24,16,58,0.03)" }}>
               <h3 style={{ fontSize: 18, fontWeight: 800, color: "#18103A", marginBottom: 20 }}>🔥 Workload Distribution</h3>
               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                 {teamMembers.map(member => {
                   const count = assignedEmails.filter(t => t.assignedTo === member.id && t.status !== "completed").length;
                   return (
                     <div key={member.id} className="team-card" style={{ padding: 20, borderRadius: 16, border: "1px solid #E2D9F3", background: "#FAF8FF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                       <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                         <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg, #7C3AED, #A78BFA)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 18, fontWeight: 800 }}>
                           {member.name.charAt(0)}
                         </div>
                         <div>
                           <div style={{ fontWeight: 800, fontSize: 14, color: "#18103A", marginBottom: 2 }}>{member.name}</div>
                           <div style={{ fontSize: 12, color: "#7a72a8", fontWeight: 600 }}>{count} Active Tasks • {member.status === "pending" ? "Invited" : member.role}</div>
                         </div>
                       </div>
                       <div style={{ width: 40, height: 40 }}>
                          <svg viewBox="0 0 36 36"><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2D9F3" strokeWidth="4" /><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={count > 5 ? "#EF4444" : "#10B981"} strokeWidth="4" strokeDasharray={`${Math.min(100, count * 15)}, 100`} /></svg>
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>

             <div style={{ flex: 1, background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)", padding: 32, borderRadius: 24, border: "1px solid #DDD6FE" }}>
               <h3 style={{ fontSize: 16, fontWeight: 800, color: "#4C1D95", marginBottom: 16, display: "flex", gap: 8 }}><span style={{fontSize: 20}}>🤖</span> Smart Workload Balancing</h3>
               {teamMembers.some(m => assignedEmails.filter(t => t.assignedTo === m.id && t.status !== "completed").length > 4) ? (
                 <div style={{ fontSize: 13, color: "#4C1D95", lineHeight: 1.6, fontWeight: 500 }}>
                   ⚠️ Notice: A team member is approaching high task overload. Consider leveraging the AI features to quickly draft replies, or reassigning lower-priority follow-ups to pending members.
                 </div>
               ) : (
                 <div style={{ fontSize: 13, color: "#4C1D95", lineHeight: 1.6, fontWeight: 500 }}>
                   ✅ Your team's workload is perfectly balanced. Inbox zero is looking highly probable today!
                 </div>
               )}
             </div>
          </div>
        </div>
      )}

      {/* ASSIGNMENTS TAB */}
      {activeTab === "assignments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {assignedEmails.length === 0 && (
            <div style={{ textAlign: "center", padding: 60, color: "#7a72a8", fontSize: 15, fontWeight: 600 }}>
               No emails shared yet. Open any email in your inbox and click "Assign to Team" to share it!
            </div>
          )}
          {assignedEmails.map(task => {
            const assignee = teamMembers.find(m => m.id === task.assignedTo);
            return (
              <div key={task.emailId} className="team-card" style={{ padding: 24, borderRadius: 20, background: "white", border: "1px solid #E2D9F3", display: "flex", gap: 24, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
                    <select 
                      value={task.status} 
                      onChange={(e) => updateTaskStatus(task.emailId, e.target.value)}
                      className={`badge badge-${task.status}`}
                      style={{ outline: "none", cursor: "pointer", appearance: "none", paddingRight: 24 }}
                    >
                      <option value="assigned">ASSIGNED</option>
                      <option value="in-progress">IN PROGRESS</option>
                      <option value="waiting-on-client">WAITING ON CLIENT</option>
                      <option value="completed">COMPLETED</option>
                    </select>
                    <span style={{ fontSize: 11, color: "#7a72a8", fontWeight: 700, padding: "4px 10px", borderRadius: 8, border: "1px solid #E2D9F3" }}>
                      Priority {task.priority}
                    </span>
                    {task.deadline && (
                      <span style={{ fontSize: 11, color: "#DC2626", fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FECACA" }}>
                        Due: {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#18103A", marginBottom: 6 }}>{task.emailId.startsWith("task_") ? "Manual Task" : `Email: ${task.emailId.substring(0, 16)}...`}</div>
                  <div style={{ fontSize: 13, color: "#7a72a8", fontWeight: 500 }}>
                    Assigned to <span style={{ color: "#7C3AED", fontWeight: 800 }}>{assignee?.name || "Unknown"}</span>
                  </div>
                  
                  {task.notes && task.notes.length > 0 && (
                    <div style={{ marginTop: 16, padding: 16, background: "#FAF8FF", borderRadius: 14, border: "1px dashed rgba(167,139,250,0.4)" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#A78BFA", textTransform: "uppercase", marginBottom: 10 }}>Internal Discussion</div>
                      {task.notes.map((note, i) => (
                        <div key={i} style={{ fontSize: 13, color: "#18103A", marginBottom: 6, fontWeight: 500 }}>
                          <strong style={{ color: "#7C3AED" }}>{note.author}:</strong> {note.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {!task.emailId.startsWith("task_") && (
                  <button onClick={() => onEmailClick?.(task.emailId)} style={{ padding: "12px 20px", borderRadius: 12, background: "#F5F3FF", color: "#7C3AED", fontWeight: 800, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                    View Original Email →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SQUAD MEMBERS TAB */}
      {activeTab === "members" && (
        <div>
          <div className="team-card" style={{ padding: 24, borderRadius: 20, background: "white", border: "1px solid #E2D9F3", marginBottom: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#18103A", marginBottom: 16, display: "flex", gap: 8 }}><span>📩</span> Invite Team Member</h3>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Member Name" style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid #E2D9F3", fontSize: 14, outline: "none", background: "#FAF8FF" }} />
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email Address" style={{ flex: 2, padding: "12px 16px", borderRadius: 12, border: "1px solid #E2D9F3", fontSize: 14, outline: "none", background: "#FAF8FF" }} />
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid #E2D9F3", fontSize: 14, outline: "none", background: "#FAF8FF", fontWeight: 600 }}>
                <option>Admin</option>
                <option>Member</option>
                <option>Viewer</option>
              </select>
              <button 
                onClick={handleInvite}
                disabled={inviting}
                style={{ padding: "12px 32px", borderRadius: 12, background: "linear-gradient(135deg, #7C3AED, #4F46E5)", color: "white", fontWeight: 800, border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(124,58,237,0.25)" }}
              >
                {inviting ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {teamMembers.map(member => (
              <div key={member.id} className="team-card" style={{ padding: 24, borderRadius: 20, background: "white", border: "1px solid #E2D9F3", textAlign: "center", position: "relative" }}>
                {member.status === "pending" && (
                  <div style={{ position: "absolute", top: 16, right: 16, fontSize: 10, background: "#FFFBEB", color: "#D97706", padding: "4px 8px", borderRadius: 6, fontWeight: 800 }}>INVITED</div>
                )}
                <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg, #A78BFA, #7C3AED)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 24, fontWeight: 900, boxShadow: "0 8px 20px rgba(124,58,237,0.25)" }}>
                  {member.name.charAt(0)}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#18103A", marginBottom: 4 }}>{member.name}</div>
                <div style={{ fontSize: 12, color: "#7a72a8", fontWeight: 600, marginBottom: 12 }}>{member.email}</div>
                <div style={{ fontSize: 11, color: "#7C3AED", fontWeight: 800, textTransform: "uppercase", background: "#F5F3FF", display: "inline-block", padding: "4px 12px", borderRadius: 8, marginBottom: 20 }}>
                   {member.role}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 32, borderTop: "1px solid #E2D9F3", paddingTop: 16 }}>
                   <div>
                     <div style={{ fontSize: 20, fontWeight: 800, color: "#18103A" }}>{assignedEmails.filter(t => t.assignedTo === member.id && t.status !== "completed").length}</div>
                     <div style={{ fontSize: 10, fontWeight: 800, color: "#7a72a8", textTransform: "uppercase" }}>Pending</div>
                   </div>
                   <div>
                     <div style={{ fontSize: 20, fontWeight: 800, color: "#18103A" }}>{member.responseRate}%</div>
                     <div style={{ fontSize: 10, fontWeight: 800, color: "#7a72a8", textTransform: "uppercase" }}>Response</div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon, gradient }: any) {
  return (
    <div className="team-card" style={{ padding: 24, borderRadius: 24, background: "white", border: "1px solid #E2D9F3", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, background: gradient, opacity: 0.15, borderRadius: "50%", filter: "blur(20px)" }} />
      <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 36, fontWeight: 900, color: "#18103A", marginBottom: 4, letterSpacing: "-1px" }}>{value}</div>
      <div style={{ fontSize: 13, color: "#7a72a8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>{title}</div>
    </div>
  );
}
