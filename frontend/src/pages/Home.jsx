import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Bell, BriefcaseBusiness,
  CalendarDays, Check, ChevronDown, ChevronRight, Clock3, Code2, Compass,
  Filter, GraduationCap, Heart, Laptop, MapPin, Menu, MessageCircle, Search,
  Send, Sparkles, Trophy, Users, X,
} from "lucide-react";
import {
  createOpportunity as createOpportunityRequest,
  completeLesson,
  deleteOpportunity as deleteOpportunityRequest,
  getCurrentAccount,
  getCurriculum,
  getMyDashboard,
  getAdminDashboard,
  listMyOpportunities,
  listSavedOpportunities,
  listAccounts,
  listMembers,
  listParticipations,
  listMessages,
  listOpportunities,
  listSubmissions,
  recordAction,
  reviewParticipation,
  reviewSubmission,
  saveCurriculum as saveCurriculumRequest,
  saveOpportunity as saveOpportunityRequest,
  sendMessage as sendMessageRequest,
  signIn,
  signUp,
  submitWork,
  updateAccountRole,
  updateOpportunity as updateOpportunityRequest,
  uploadFile,
  unsaveOpportunity as unsaveOpportunityRequest,
} from "../services/platformService.js";

const opportunities = [
  { id: "design-forward", type: "event", category: "Design", title: "Design Forward Challenge 2026", company: "Adobe Creative Community", date: "Nov 18, 2026", deadline: "Nov 15, 2026", location: "Online", mode: "Online", image: "photo-1558655146-d09347e92766", color: "lavender", prize: "₹2,00,000 in prizes", tag: "TRENDING", applicants: "2.4k", description: "A creative challenge for the next generation of visual storytellers. Reimagine the everyday and present a design that makes a difference.", eligibility: "Students and early-career designers from any discipline.", skills: ["Figma", "Visual design", "Storytelling"], organizer: "Adobe Creative Community" },
  { id: "future-builders", type: "event", category: "Technology", title: "Future Builders Hackathon", company: "Northstar Labs", date: "Nov 22, 2026", deadline: "Nov 19, 2026", location: "Online", mode: "Online", image: "photo-1519389950473-47ba0277781c", color: "mint", prize: "₹1,50,000 prize pool", tag: "REGISTRATIONS OPEN", applicants: "1.8k", description: "Build what's next. Join a team of ambitious builders and create practical technology for a more connected world.", eligibility: "Open to undergraduate and postgraduate students. Teams of 2–4.", skills: ["React", "AI / ML", "Product thinking"], organizer: "Northstar Labs" },
  { id: "product-sprint", type: "event", category: "Business", title: "The Product Sprint", company: "Foundry Fellows", date: "Nov 27, 2026", deadline: "Nov 23, 2026", location: "Mumbai · Hybrid", mode: "Hybrid", image: "photo-1521737711867-e3b97375f902", color: "peach", prize: "Mentorship + ₹75,000", tag: "FEW DAYS LEFT", applicants: "956", description: "A fast-paced product case competition where ideas turn into prototypes. Learn from product leaders and pitch your solution.", eligibility: "Open to all students. Individual and team entries welcome.", skills: ["Product strategy", "Research", "Prototyping"], organizer: "Foundry Fellows" },
  { id: "impact-lab", type: "event", category: "Social Impact", title: "Impact Lab: Ideas for Good", company: "Goodworks Foundation", date: "Dec 02, 2026", deadline: "Nov 28, 2026", location: "Online", mode: "Online", image: "photo-1531482615713-2afd69097998", color: "blue", prize: "₹1,00,000 grants", tag: "NEW", applicants: "634", description: "Bring an idea with the power to move communities forward. A collaborative innovation sprint for high-impact ideas.", eligibility: "Students, young professionals, and community builders.", skills: ["Social innovation", "Research", "Communication"], organizer: "Goodworks Foundation" },
  { id: "data-stories", type: "training", category: "Technology", title: "Data Storytelling with Python", company: "SkillConnect Academy", date: "Nov 20, 2026", deadline: "Nov 17, 2026", location: "Online", mode: "Online", duration: "4 weeks", image: "photo-1551288049-bebda4e38f71", color: "blue", tag: "LIVE COHORT", applicants: "428", trainer: "Aarav Mehta · Analytics Lead", description: "Go from raw data to stories people remember. A practical, mentor-led cohort covering Python, visualization, and presentation.", eligibility: "Beginner-friendly. Bring curiosity and a laptop.", skills: ["Python", "Pandas", "Data visualization"], organizer: "SkillConnect Academy" },
  { id: "ux-bootcamp", type: "training", category: "Design", title: "UX Design: From Insight to Interface", company: "Studio Practice", date: "Nov 24, 2026", deadline: "Nov 21, 2026", location: "Online", mode: "Online", duration: "6 weeks", image: "photo-1581291518857-4e27b48ff24e", color: "lavender", tag: "MENTOR-LED", applicants: "312", trainer: "Mira Shah · Senior Product Designer", description: "Learn the craft and thinking behind meaningful digital products, from your first interview to a polished prototype.", eligibility: "No prior design experience required.", skills: ["Figma", "User research", "Prototyping"], organizer: "Studio Practice" },
  { id: "frontend-foundations", type: "training", category: "Technology", title: "Frontend Foundations: React & Beyond", company: "Buildschool", date: "Dec 01, 2026", deadline: "Nov 27, 2026", location: "Online", mode: "Online", duration: "8 weeks", image: "photo-1498050108023-c5249f4df085", color: "mint", tag: "BEGINNER FRIENDLY", applicants: "1.2k", trainer: "Rohan Kapoor · Staff Engineer", description: "A hands-on learning path from web fundamentals to production-ready React interfaces—with a portfolio to show for it.", eligibility: "Students and career switchers. Basic computer skills required.", skills: ["HTML & CSS", "JavaScript", "React"], organizer: "Buildschool" },
  { id: "career-launchpad", type: "training", category: "Business", title: "Career Launchpad: Your Next Chapter", company: "The Work Lab", date: "Dec 04, 2026", deadline: "Nov 30, 2026", location: "Bengaluru · Hybrid", mode: "Hybrid", duration: "3 weeks", image: "photo-1522202176988-66273c2fd55f", color: "peach", tag: "COHORT 08", applicants: "297", trainer: "Ananya Iyer · Career Coach", description: "Turn what you're great at into a career you love. Get one-to-one guidance on your story, interviews, and search.", eligibility: "Final-year students and graduates with up to 2 years' experience.", skills: ["Interviewing", "Personal branding", "Job search"], organizer: "The Work Lab" },
  { id: "associate-designer", type: "job", category: "Design", title: "Associate Product Designer", company: "Canopy Studio", date: "Starts Jan 2027", deadline: "Nov 29, 2026", location: "Bengaluru · Hybrid", mode: "Hybrid", salary: "₹8–12 LPA", image: "photo-1552664730-d307ca884978", color: "lavender", tag: "EARLY CAREER", applicants: "142", description: "Help a small, thoughtful design team make the complex feel simple. Own projects from the first sketch to the final details.", eligibility: "0–2 years of experience. A portfolio demonstrating thoughtful product work.", skills: ["Figma", "Interaction design", "Prototyping"], organizer: "Canopy Studio" },
  { id: "junior-developer", type: "job", category: "Technology", title: "Junior Software Engineer", company: "Northstar Labs", date: "Starts Jan 2027", deadline: "Dec 03, 2026", location: "Remote · India", mode: "Remote", salary: "₹10–16 LPA", image: "photo-1522071820081-009f0129c71c", color: "mint", tag: "FRESHERS WELCOME", applicants: "386", description: "Ship features with a friendly engineering team. You'll have a mentor, meaningful ownership, and space to learn by doing.", eligibility: "Graduating in 2026 or graduated within the last 2 years.", skills: ["JavaScript", "React", "Problem solving"], organizer: "Northstar Labs" },
  { id: "marketing-associate", type: "job", category: "Business", title: "Growth Marketing Associate", company: "Daybreak", date: "Starts Dec 2026", deadline: "Dec 06, 2026", location: "Mumbai · On-site", mode: "On-site", salary: "₹6–9 LPA", image: "photo-1556761175-b413da4baf72", color: "peach", tag: "JUST POSTED", applicants: "89", description: "Join an ambitious consumer startup and help more people find something they love. Creative instincts matter as much as data.", eligibility: "0–2 years' experience. Internships and projects count.", skills: ["Content", "Analytics", "Experimentation"], organizer: "Daybreak" },
];

const categories = [
  { label: "All opportunities", icon: Sparkles, value: "All" },
  { label: "Competitions", icon: Trophy, value: "Events" },
  { label: "Learning", icon: GraduationCap, value: "Training" },
  { label: "Jobs", icon: BriefcaseBusiness, value: "Jobs" },
  { label: "Technology", icon: Code2, value: "Technology" },
  { label: "Design", icon: Laptop, value: "Design" },
];

const imageUrl = (id, width = 720) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
const displayDate = (value) => value
  ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`))
  : "Date to be announced";
const dateInputValue = (value) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
};
const deadlineAt = (value) => {
  if (!value) return null;
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T23:59:59`)
    : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) parsed.setHours(23, 59, 59, 999);
  return parsed;
};
const deadlineStatus = (item, now = Date.now()) => {
  if (item.status === "closed" || item.status === "deleted") return "Closed";
  if (item.status === "draft") return "Draft";
  const due = deadlineAt(item.deadline);
  if (!due) return "Open";
  const remaining = due.getTime() - now;
  if (remaining < 0) return "Closed";
  return remaining <= 3 * 86400000 ? "Closing Soon" : "Open";
};
const fromApiOpportunity = (item) => ({
  ...item,
  id: String(item.id),
  date: displayDate(item.start_date),
  deadline: item.deadline || "",
  image: item.image_url || "photo-1521737711867-e3b97375f902",
  color: item.category === "Technology" ? "mint" : item.category === "Business" ? "peach" : "lavender",
  tag: item.status === "closed" ? "CLOSED" : "NEW",
  applicants: "0",
  prize: item.type === "event" ? undefined : item.salary,
});
const errorMessage = (error) => {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((entry) => entry.msg).filter(Boolean).join("; ");
  return error.message || "The service is temporarily unavailable.";
};
const load = (key, initial) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? initial; } catch { return initial; }
};

function Picture({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);
  return <img className={className} src={failed ? `https://picsum.photos/seed/${encodeURIComponent(alt)}/900/560` : src} alt={alt} onError={() => setFailed(true)} />;
}

function OpportunityCard({ item, saved, onSave, onOpen, compact = false }) {
  const status = deadlineStatus(item);
  return (
    <article className={`opportunity-card ${compact ? "compact-card" : ""}`}>
      <button className="card-image-button" type="button" onClick={() => onOpen(item)} aria-label={`View ${item.title}`}>
        <Picture src={imageUrl(item.image)} alt={item.title} className="card-image" />
        <span className={`type-chip ${item.type}`}>{item.type === "event" ? "Competition" : item.type === "training" ? "Learning" : "Opportunity"}</span>
        {!/^\d+$/.test(String(item.id)) && <span className="demo-browse-chip">Sample · browse only</span>}
        <span className={`deadline-chip ${status === "Closed" ? "closed" : ""}`}>{status}</span>
        <span className="image-arrow"><ArrowUpRight size={17} /></span>
      </button>
      <div className="card-content">
        <div className="company-line"><span className={`company-mark ${item.color}`}>{item.company.slice(0, 1)}</span><span>{item.company}</span></div>
        <button className="card-title" type="button" onClick={() => onOpen(item)}>{item.title}</button>
        <div className="card-facts">
          <span><CalendarDays size={14} />{item.type === "job" ? item.date : item.date}</span>
          <span><MapPin size={14} />{item.location}</span>
        </div>
        <div className="card-footer">
          <span className="applicant-count"><Users size={14} />{item.applicants} interested</span>
          <button className={`save-button ${saved ? "saved" : ""}`} type="button" onClick={() => onSave(item)} aria-label={saved ? "Remove saved opportunity" : "Save opportunity"}><Heart size={17} fill={saved ? "currentColor" : "none"} /></button>
        </div>
      </div>
    </article>
  );
}

function Overlay({ children, onClose, wide = false }) {
  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className={`dialog ${wide ? "dialog-wide" : ""}`} role="dialog" aria-modal="true">{children}</section></div>;
}

function Deadline({ date }) {
  const due = deadlineAt(date);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!due) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [date]);
  if (!due) return <span className="deadline-label"><Clock3 size={14} />No deadline</span>;
  const remaining = due.getTime() - now;
  if (remaining < 0) return <span className="deadline-label closed"><Clock3 size={14} />Closed</span>;
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const label = days
    ? `Closes in ${days}d ${hours}h`
    : `Closes in ${hours}h ${minutes}m ${seconds}s`;
  return <span className={`deadline-label ${remaining <= 3 * 86400000 ? "soon" : ""}`}><Clock3 size={14} />{label}</span>;
}

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [saved, setSaved] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [trainingProgress, setTrainingProgress] = useState({});
  const [activityRecords, setActivityRecords] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [completedLessonIds, setCompletedLessonIds] = useState(() => new Set());
  const [openedLessonId, setOpenedLessonId] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [user, setUser] = useState(() => load("sc-user", null));
  const [mobileMenu, setMobileMenu] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [apiItems, setApiItems] = useState([]);
  const [apiStatus, setApiStatus] = useState("connecting");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [jobFilter, setJobFilter] = useState("All");

  const allItems = useMemo(() => {
    const byId = new Map([...opportunities, ...apiItems].map((item) => [String(item.id), item]));
    return [...byId.values()];
  }, [apiItems]);
  const path = location.pathname;
  const detailMatch = path.match(/^\/(events|training|jobs)\/([^/]+)$/);
  const detailItem = detailMatch ? allItems.find((item) => String(item.id) === detailMatch[2]) : null;
  const searchResults = useMemo(() => {
    const value = query.trim().toLowerCase();
    let items = allItems.filter((item) => {
      const matchesQuery = !value || `${item.title} ${item.company} ${item.category} ${item.skills?.join(" ")}`.toLowerCase().includes(value);
      const matchesCategory = category === "All" || (category === "Events" ? item.type === "event" : category === "Training" ? item.type === "training" : category === "Jobs" ? item.type === "job" : item.category === category);
      return matchesQuery && matchesCategory;
    });
    if (path === "/jobs") items = items.filter((item) => item.type === "job" && (jobFilter === "All" || item.mode === jobFilter));
    if (path === "/events") items = items.filter((item) => item.type === "event");
    if (path === "/training") items = items.filter((item) => item.type === "training");
    return items;
  }, [allItems, category, jobFilter, path, query]);

  useEffect(() => {
    let active = true;
    listOpportunities()
      .then((items) => {
        if (!active) return;
        setApiItems(items.map(fromApiOpportunity));
        setApiStatus("online");
      })
      .catch(() => {
        if (active) setApiStatus("offline");
      });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!localStorage.getItem("sc-token")) {
      localStorage.removeItem("sc-user");
      setUser(null);
      return undefined;
    }
    let active = true;
    getCurrentAccount()
      .then((account) => {
        if (!active) return;
        const verifiedUser = { id: account.id, name: account.name, email: account.email, role: account.role };
        setUser((current) => current
          && current.id === verifiedUser.id
          && current.name === verifiedUser.name
          && current.email === verifiedUser.email
          && current.role === verifiedUser.role
          ? current
          : verifiedUser);
        localStorage.setItem("sc-user", JSON.stringify(verifiedUser));
        setApiStatus("online");
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem("sc-token");
        localStorage.removeItem("sc-user");
        setUser(null);
        setApiStatus("offline");
      });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!user || !localStorage.getItem("sc-token")) return undefined;
    let active = true;
    Promise.allSettled([getMyDashboard(), listSavedOpportunities(), listMembers()])
      .then(([dashboardResult, savedResult, membersResult]) => {
        if (!active) return;
        if (dashboardResult.status === "fulfilled") {
          const dashboard = dashboardResult.value;
          const activity = dashboard.activity;
          setActivityRecords(activity);
          setRegistrations(activity.filter((entry) => entry.kind === "registration").map((entry) => String(entry.opportunity_id)));
          setEnrollments(activity.filter((entry) => entry.kind === "enrollment").map((entry) => String(entry.opportunity_id)));
          setApplications(activity.filter((entry) => entry.kind === "application").map((entry) => String(entry.opportunity_id)));
          setTrainingProgress(Object.fromEntries(activity.filter((entry) => entry.kind === "enrollment").map((entry) => [String(entry.opportunity_id), entry.progress])));
          setSubmissions(dashboard.submissions);
          setUpcomingDeadlines(dashboard.upcoming_deadlines);
          setCompletedLessonIds(new Set(dashboard.lesson_progress.map((entry) => entry.lesson_id)));
        }
        if (savedResult.status === "fulfilled") setSaved(savedResult.value.map((item) => String(item.id)));
        if (membersResult.status === "fulfilled") {
          setMembers(membersResult.value);
          if (!selectedRecipient && membersResult.value.length) setSelectedRecipient(String(membersResult.value[0].id));
        }
        const failures = [dashboardResult, savedResult, membersResult]
          .filter((result) => result.status === "rejected")
          .map((result) => errorMessage(result.reason));
        if (failures.length) {
          setApiStatus("offline");
          setToast(failures.join(" "));
        } else {
          setApiStatus("online");
        }
      });
    return () => { active = false; };
  }, [user]);
  useEffect(() => {
    if (!detailItem || detailItem.type !== "training" || !/^\d+$/.test(String(detailItem.id))) {
      setCurriculum([]);
      setOpenedLessonId(null);
      return undefined;
    }
    setOpenedLessonId(null);
    let active = true;
    getCurriculum(Number(detailItem.id))
      .then((modules) => { if (active) setCurriculum(modules); })
      .catch((error) => { if (active) setToast(errorMessage(error)); });
    return () => { active = false; };
  }, [detailItem?.id]);
  useEffect(() => { if (!toast) return undefined; const timeout = setTimeout(() => setToast(""), 3200); return () => clearTimeout(timeout); }, [toast]);

  const notify = (text) => setToast(text);
  const logout = () => {
    localStorage.removeItem("sc-token");
    localStorage.removeItem("sc-user");
    setUser(null);
    setSaved([]);
    setRegistrations([]);
    setApplications([]);
    setEnrollments([]);
    setTrainingProgress({});
    setActivityRecords([]);
    setSubmissions([]);
    setUpcomingDeadlines([]);
    setCompletedLessonIds(new Set());
    setMembers([]);
    setMessages([]);
    setSelectedRecipient("");
    setModal(null);
    setApiStatus("online");
    navigate("/");
    notify("You have been signed out.");
  };
  const go = (to) => { setMobileMenu(false); setQuery(""); navigate(to); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openItem = (item) => go(`/${item.type === "event" ? "events" : item.type === "training" ? "training" : "jobs"}/${item.id}`);
  const toggleSaved = async (item) => {
    if (!/^\d+$/.test(String(item.id))) return notify("This curated example is for browsing. Save a published opportunity to keep it in your dashboard.");
    if (!localStorage.getItem("sc-token")) {
      setModal({ type: "auth", mode: "signup" });
      return;
    }
    try {
      if (saved.includes(String(item.id))) {
        await unsaveOpportunityRequest(Number(item.id));
        setSaved((current) => current.filter((entry) => entry !== String(item.id)));
      } else {
        await saveOpportunityRequest(Number(item.id));
        setSaved((current) => [...new Set([...current, String(item.id)])]);
      }
    } catch (error) {
      notify(errorMessage(error));
    }
  };
  const takeAction = async (item) => {
    if (deadlineStatus(item) === "Closed") {
      notify("This opportunity's deadline has passed.");
      return;
    }
    if (!/^\d+$/.test(String(item.id))) {
      notify("This curated example is for browsing. Actions are available on published opportunities.");
      return;
    }
    if (!user) { setModal({ type: "auth", mode: "signup", intent: item }); return; }
    const alreadyParticipating = item.type === "event"
      ? registrations.includes(item.id)
      : item.type === "training"
        ? enrollments.includes(item.id)
        : applications.includes(item.id);
    if (alreadyParticipating) return notify("Your activity for this opportunity is already recorded.");
    try {
      const kind = item.type === "event" ? "registration" : item.type === "training" ? "enrollment" : "application";
      const record = await recordAction(Number(item.id), kind);
      setActivityRecords((records) => [...records.filter((entry) => entry.id !== record.id), {
        ...record,
        opportunity_id: Number(item.id),
        opportunity_title: item.title,
        opportunity_type: item.type,
        deadline: item.deadline || null,
      }]);
      if (item.type === "event") setRegistrations((current) => [...new Set([...current, item.id])]);
      if (item.type === "training") setEnrollments((current) => [...new Set([...current, item.id])]);
      if (item.type === "job") setApplications((current) => [...new Set([...current, item.id])]);
      notify(item.type === "event" ? "Registration submitted for organizer approval." : item.type === "training" ? `You're enrolled in ${item.title}.` : `Your application for ${item.title} was submitted.`);
    } catch (error) {
      notify(errorMessage(error));
    }
  };
  const submitAuth = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const isSignup = modal.mode === "signup";
    let response;
    try {
      response = isSignup
        ? await signUp({ name: data.get("name"), email: data.get("email"), password: data.get("password"), role: String(data.get("role")).toLowerCase() })
        : await signIn({ email: data.get("email"), password: data.get("password") });
    } catch (error) {
      if (!error.response) setApiStatus("offline");
      notify(errorMessage(error));
      return;
    }
    localStorage.setItem("sc-token", response.access_token);
    const nextUser = { id: response.account.id, name: response.account.name, email: response.account.email, role: response.account.role };
    setUser(nextUser);
    localStorage.setItem("sc-user", JSON.stringify(nextUser));
    setApiStatus("online");
    const intent = modal?.intent;
    if (intent?.action === "submit") {
      setModal({ type: "submit", item: intent.item, draft: intent.draft });
      notify(`Welcome, ${nextUser.name.split(" ")[0]}. Your submission draft is ready.`);
      return;
    }
    setModal(null);
    if (intent && /^\d+$/.test(String(intent.id))) {
      try {
        const kind = intent.type === "event" ? "registration" : intent.type === "training" ? "enrollment" : "application";
        const record = await recordAction(Number(intent.id), kind);
        setActivityRecords((records) => [...records, {
          ...record,
          opportunity_id: Number(intent.id),
          opportunity_title: intent.title,
          opportunity_type: intent.type,
          deadline: intent.deadline || null,
        }]);
        if (intent.type === "event") setRegistrations((current) => [...new Set([...current, intent.id])]);
        if (intent.type === "training") setEnrollments((current) => [...new Set([...current, intent.id])]);
        if (intent.type === "job") setApplications((current) => [...new Set([...current, intent.id])]);
        notify(intent.type === "event" ? "Registration submitted for organizer approval." : `Your action for ${intent.title} was saved.`);
      } catch (error) {
        notify(errorMessage(error));
      }
    } else if (intent) {
      notify("Your account is ready. This curated example is for browsing; actions require a published opportunity.");
    } else {
      notify(`Welcome, ${nextUser.name.split(" ")[0]}. Your profile is ready.`);
    }
  };
  const completeTrainingLesson = async (lessonId) => {
    if (!localStorage.getItem("sc-token")) {
      setModal({ type: "auth", mode: "signup" });
      return;
    }
    try {
      const completion = await completeLesson(lessonId);
      setCompletedLessonIds((current) => new Set([...current, completion.lesson_id]));
      const dashboard = await getMyDashboard();
      const activity = dashboard.activity;
      setActivityRecords(activity);
      setTrainingProgress(Object.fromEntries(activity.filter((entry) => entry.kind === "enrollment").map((entry) => [String(entry.opportunity_id), entry.progress])));
      notify("Lesson completed. Your progress is saved.");
    } catch (error) {
      notify(errorMessage(error));
    }
  };
  const openOpportunityForm = () => {
    if (!user) {
      setModal({ type: "auth", mode: "signup" });
      return;
    }
    if (!["admin", "organizer", "trainer"].includes(String(user.role).toLowerCase())) {
      notify("Listing management is available to trainers, organizers, and administrators.");
      return;
    }
    setModal({ type: "create" });
  };
  const openCurriculumEditor = async (item) => {
    if (!/^\d+$/.test(String(item.id))) return notify("Curriculum editing requires a published training program.");
    try {
      const modules = await getCurriculum(Number(item.id));
      setModal({ type: "curriculum", item, modules });
    } catch (error) {
      notify(errorMessage(error));
    }
  };
  const saveCurriculum = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const lessons = String(data.get("lessons") || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [title, ...content] = line.split("|");
        return { title: title.trim(), content: content.join("|").trim() };
      });
    if (!lessons.length || lessons.some((lesson) => !lesson.title)) {
      notify("Add at least one lesson title.");
      return;
    }
    try {
      const modules = await saveCurriculumRequest(Number(modal.item.id), [{ title: "Course curriculum", lessons }]);
      setCurriculum(modules);
      setModal(null);
      notify("Training curriculum saved.");
    } catch (error) {
      notify(errorMessage(error));
    }
  };
  const createOpportunity = async (event) => {
    event.preventDefault();
    if (!localStorage.getItem("sc-token")) {
      notify("Sign in to publish or edit a listing.");
      return;
    }
    const data = new FormData(event.currentTarget);
    const editing = modal.item;
    if (editing && !/^\d+$/.test(String(editing.id))) {
      notify("Only published listings can be edited.");
      return;
    }
    const payload = {
      type: data.get("type"),
      category: data.get("category"),
      title: data.get("title"),
      company: data.get("company"),
      description: data.get("description"),
      eligibility: data.get("eligibility"),
      location: data.get("location"),
      mode: data.get("mode"),
      start_date: data.get("date") || null,
      deadline: data.get("deadline") || null,
      duration: data.get("duration") || null,
      skills: String(data.get("skills") || "").split(",").map((skill) => skill.trim()).filter(Boolean),
      salary: data.get("salary") || null,
      ...(editing ? { status: data.get("status") } : {}),
    };
    try {
      const result = editing
        ? await updateOpportunityRequest(Number(editing.id), payload)
        : await createOpportunityRequest(payload);
      const item = fromApiOpportunity(result);
      setApiItems((items) => editing
        ? items.map((entry) => entry.id === item.id ? item : entry)
        : [item, ...items.filter((entry) => entry.id !== item.id)]);
      setModal(null);
      notify(editing ? "Your listing has been updated." : "Your listing is live.");
    } catch (error) {
      notify(errorMessage(error));
    }
  };
  const removeOpportunity = async (item) => {
    if (!window.confirm(`Remove "${item.title}" from your listings?`)) return;
    if (!/^\d+$/.test(String(item.id)) || !localStorage.getItem("sc-token")) {
      notify("Only published listings can be removed.");
      return;
    }
    try {
      await deleteOpportunityRequest(Number(item.id));
      setApiItems((items) => items.filter((entry) => entry.id !== item.id));
      notify("Listing removed. Existing participant records are preserved.");
    } catch (error) {
      notify(errorMessage(error));
    }
  };
  const submitProject = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const formFile = data.get("file");
    const file = formFile instanceof File && formFile.size > 0 ? formFile : modal.draft?.file;
    const link = String(data.get("link") || "").trim();
    if (!link && !(file instanceof File && file.size > 0)) {
      notify("Add a project link or attach a file before submitting.");
      return;
    }
    if (deadlineStatus(modal.item) === "Closed") {
      notify("This submission deadline has passed.");
      return;
    }
    if (!localStorage.getItem("sc-token")) {
      setModal({
        type: "auth",
        mode: "signup",
        intent: {
          action: "submit",
          item: modal.item,
          draft: { link, description: data.get("description"), file },
        },
      });
      return;
    }
    if (!/^\d+$/.test(String(modal.item.id))) {
      notify("Submissions are available for published events and training programs.");
      return;
    }
    try {
      const uploaded = file instanceof File && file.size > 0 ? await uploadFile(file) : null;
      const submitted = await submitWork({
        opportunity_id: Number(modal.item.id),
        link: link || null,
        attachment: uploaded?.stored_name || null,
        description: data.get("description"),
      });
      setSubmissions((current) => [{
        ...submitted,
        opportunity_title: modal.item.title,
        deadline: modal.item.deadline || null,
      }, ...current.filter((entry) => entry.id !== submitted.id)]);
      setModal(null);
      notify("Your work is in. You can update it before the deadline.");
    } catch (error) {
      notify(errorMessage(error));
    }
  };
  const sendApiMessage = useCallback(async (text, recipientId) => {
    const sent = await sendMessageRequest({ recipient_id: Number(recipientId), body: text });
    setMessages((current) => [...current, {
      text: sent.body,
      from: "you",
      time: new Date(sent.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }]);
  }, []);

  const featured = [allItems[0], allItems[1], allItems[5]].filter(Boolean);
  const featuredItem = featured[bannerIndex % featured.length];

  return (
    <div className="site-shell">
      <div className="announcement"><Sparkles size={14} /> A little progress, every day. <button onClick={() => go("/training")}>Find your next step <ArrowRight size={13} /></button></div>
      <header className="site-header">
        <div className="header-main">
          <button className="mobile-menu-button icon-button" onClick={() => setMobileMenu((open) => !open)} aria-label="Toggle navigation"><Menu size={21} /></button>
          <Link to="/" className="brand" onClick={() => { setCategory("All"); setQuery(""); }}><span className="brand-symbol"><Compass size={21} strokeWidth={2.5} /></span><span>skill<span>connect</span><i>.</i></span></Link>
          <div className="search-wrap"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && navigate("/explore")} placeholder="Search opportunities, skills, companies..." aria-label="Search opportunities" />{query && <button className="clear-search" onClick={() => setQuery("")} aria-label="Clear search"><X size={15} /></button>}<span className="search-key">↵</span></div>
          <button className="for-organizers" onClick={() => go("/organizer")}><BriefcaseBusiness size={16} /><span>For organizers</span></button>
          {user ? <div className="auth-actions"><button className="profile-button" onClick={() => go("/dashboard")} aria-label="Open dashboard"><span className="avatar">{user.name?.slice(0, 1) || "A"}</span><span className="profile-name">{user.name?.split(" ")[0]}</span><ChevronDown size={14} /></button><button className="logout-button" onClick={logout}>Sign out</button></div> : <div className="auth-actions"><button className="login-button" onClick={() => setModal({ type: "auth", mode: "login" })}>Log in</button><button className="signup-button" onClick={() => setModal({ type: "auth", mode: "signup" })}>Join free <ArrowRight size={15} /></button></div>}
        </div>
        <nav className={`nav-row ${mobileMenu ? "mobile-open" : ""}`} aria-label="Main navigation">
          <div className="nav-links">
            {[["Explore", "/"], ["Competitions", "/events"], ["Learning", "/training"], ["Jobs", "/jobs"], ["My dashboard", "/dashboard"]].map(([label, href]) => <Link key={href} to={href} onClick={(event) => { event.preventDefault(); go(href); }} className={(path === href || (href === "/" && path === "/explore")) ? "active" : ""}>{label}{label === "Explore" && <ChevronDown size={14} />}</Link>)}
          </div>
          <button className="nav-deadline" onClick={() => go("/dashboard")}><Bell size={15} /> Your next big thing is closer than you think</button>
        </nav>
      </header>

      <main>
        {detailMatch && detailItem ? (
          <div className="detail-page page-container">
            <button className="back-link" onClick={() => go(`/${detailMatch[1]}`)}><ArrowLeft size={16} /> Back to {detailItem.type === "event" ? "competitions" : detailItem.type === "training" ? "learning" : "jobs"}</button>
            <div className="detail-grid">
              <div className="detail-main">
                <div className="detail-cover"><Picture src={imageUrl(detailItem.image, 1200)} alt={detailItem.title} /><span className="detail-cover-shade" /></div>
                <div className="detail-heading"><div className="company-line"><span className={`company-mark ${detailItem.color}`}>{detailItem.company.slice(0, 1)}</span>{detailItem.company}</div><h1>{detailItem.title}</h1><p>{detailItem.description}</p></div>
                <div className="detail-facts">{detailItem.type === "training" && <div><Clock3 /><span><b>Duration</b>{detailItem.duration}</span></div>}<div><CalendarDays /><span><b>{detailItem.type === "job" ? "Start date" : "Date"}</b>{detailItem.date}</span></div><div><MapPin /><span><b>Location</b>{detailItem.location}</span></div><div><Users /><span><b>People interested</b>{detailItem.applicants}</span></div></div>
                <section className="detail-section">
                  <span className="eyebrow">THE OPPORTUNITY</span>
                  <h2>A good next step starts here.</h2>
                  <p>{detailItem.description} Explore a new challenge, meet people who share your curiosity, and make something worth talking about.</p>
                  <h3>Who should join?</h3>
                  <p>{detailItem.eligibility}</p>
                  <h3>What you'll bring</h3>
                  <div className="skill-tags">{detailItem.skills?.map((skill) => <span key={skill}>{skill}</span>)}</div>
                  {detailItem.type === "training" && (
                    <>
                      <h3>Curriculum</h3>
                      {curriculum.length ? (
                        <ol className="curriculum-list">
                          {curriculum.flatMap((module) => module.lessons.map((lesson) => (
                            <li key={lesson.id}>
                              <span>{lesson.position + 1}</span>
                              <span>
                                <button
                                  type="button"
                                  className="lesson-open-button"
                                  aria-expanded={openedLessonId === lesson.id}
                                  onClick={() => setOpenedLessonId((current) => current === lesson.id ? null : lesson.id)}
                                >
                                  {lesson.title}
                                </button>
                                {openedLessonId === lesson.id && lesson.content && <small>{lesson.content}</small>}
                              </span>
                              {enrollments.includes(detailItem.id) && (
                                <button
                                  type="button"
                                  disabled={completedLessonIds.has(lesson.id)}
                                  onClick={() => completeTrainingLesson(lesson.id)}
                                >
                                  {completedLessonIds.has(lesson.id) ? "Completed" : "Mark complete"}
                                </button>
                              )}
                            </li>
                          )))}
                        </ol>
                      ) : <p>{/^\d+$/.test(String(detailItem.id)) ? "The trainer has not published lessons yet." : "Curriculum preview only. Enrollments and progress require a published training program."}</p>}
                      {enrollments.includes(detailItem.id) && (
                        <div className="course-progress">
                          <div><span>YOUR LEARNING PROGRESS</span><b>{trainingProgress[detailItem.id] || 0}%</b></div>
                          <div className="progress-track"><span style={{ width: `${trainingProgress[detailItem.id] || 0}%` }} /></div>
                        </div>
                      )}
                    </>
                  )}
                </section>
                <section className="detail-section"><span className="eyebrow">A FEW THINGS TO KNOW</span><h3>Eligibility</h3><p>{detailItem.eligibility}</p><h3>Deadline</h3><Deadline date={detailItem.deadline} /></section>
              </div>
              <aside className="detail-aside"><div className="apply-card"><span className="eyebrow">{detailItem.type === "event" ? "MAKE IT HAPPEN" : detailItem.type === "training" ? "YOUR NEXT SKILL" : "YOUR NEXT CHAPTER"}</span><h2>{detailItem.type === "job" ? detailItem.salary : detailItem.prize || detailItem.duration}</h2><Deadline date={detailItem.deadline} /><div className="aside-divider" /><div className="aside-line"><CalendarDays size={16} /><span><b>{detailItem.type === "job" ? "Application deadline" : "Registration deadline"}</b>{detailItem.deadline || "Not specified"}</span></div><div className="aside-line"><MapPin size={16} /><span><b>Format</b>{detailItem.mode}</span></div><button className="primary-button full-button" disabled={deadlineStatus(detailItem) === "Closed" || deadlineStatus(detailItem) === "Draft"} onClick={() => takeAction(detailItem)}>{(detailItem.type === "event" && registrations.includes(detailItem.id)) || (detailItem.type === "training" && enrollments.includes(detailItem.id)) || (detailItem.type === "job" && applications.includes(detailItem.id)) ? <><Check size={17} /> {activityRecords.find((entry) => String(entry.opportunity_id) === String(detailItem.id))?.status || "Submitted"}</> : <>{detailItem.type === "event" ? "Register for free" : detailItem.type === "training" ? "Join this cohort" : "Apply for this role"} <ArrowRight size={17} /></>}</button>{detailItem.type !== "job" && <button className="secondary-submit" disabled={!/^\d+$/.test(String(detailItem.id)) || deadlineStatus(detailItem) === "Closed"} onClick={() => setModal({ type: "submit", item: detailItem })}>Share your project <ArrowUpRight size={15} /></button>}<p className="safe-note">No fees, no pressure. Just a good place to start.</p></div><button className="aside-message" onClick={() => setModal({ type: "chat" })}><MessageCircle size={18} /><span><b>Questions?</b>Chat with our team</span><ChevronRight size={16} /></button></aside>
            </div>
          </div>
        ) : path === "/dashboard" || path === "/admin" ? (
          <Dashboard user={user} onLogin={() => setModal({ type: "auth", mode: "login" })} onLogout={logout} onNavigate={go} items={allItems} registrations={registrations} enrollments={enrollments} applications={applications} saved={saved} activity={activityRecords} submissions={submissions} upcomingDeadlines={upcomingDeadlines} onOpen={openItem} admin={path === "/admin"} onCreate={openOpportunityForm} onEdit={(item) => setModal({ type: "create", item })} onManageCurriculum={openCurriculumEditor} onDelete={removeOpportunity} />
        ) : path === "/organizer" ? (
          <OrganizerDashboard user={user} onCreate={openOpportunityForm} onEdit={(item) => setModal({ type: "create", item })} onManageCurriculum={openCurriculumEditor} onDelete={removeOpportunity} onLogin={() => setModal({ type: "auth", mode: "login" })} onLogout={logout} />
        ) : path === "/messages" ? (
          <div className="messages-page page-container"><div className="section-heading"><span className="eyebrow">A HUMAN ON THE OTHER SIDE</span><h1>Your conversations</h1></div><Chat messages={messages} setMessages={setMessages} message={message} setMessage={setMessage} user={user} members={members} selectedRecipient={selectedRecipient} setSelectedRecipient={setSelectedRecipient} onApiSend={user && localStorage.getItem("sc-token") ? sendApiMessage : null} onRequestLogin={() => setModal({ type: "auth", mode: "login" })} /></div>
        ) : (
          <div className="page-container">
            {(path === "/" || path === "/explore") && <>
              <section className="welcome-strip"><span>Good morning, {user?.name?.split(" ")[0] || "there"} <span className="wave">✳</span></span><span>{apiStatus === "online" ? apiItems.length ? "Live listings plus curated browse-only samples" : "Connected · curated samples are browse-only" : apiStatus === "offline" ? "API offline · curated samples are browse-only" : "Finding the good stuff for you..."}</span></section>
              <section className="hero-section">
                <div className="hero-copy"><span className="eyebrow"><span className="eyebrow-dot" />YOUR NEXT CHAPTER STARTS HERE</span><h1>Find the thing<br />that makes you <em>come alive.</em></h1><p>Big opportunities don't always arrive with a big announcement. Sometimes they start right here.</p><div className="hero-cta-row"><button className="primary-button" onClick={() => { document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" }); }}>Explore opportunities <ArrowRight size={17} /></button><button className="text-button" onClick={() => go("/training")}>Find your learning path <ArrowUpRight size={16} /></button></div><div className="hero-proof"><span className="hero-proof-symbol"><Users size={17} /></span><span>Published opportunities and sample listings are clearly marked</span></div></div>
                <div className="hero-visual"><div className={`feature-art ${featuredItem.color}`}><Picture src={imageUrl(featuredItem.image, 1050)} alt={featuredItem.title} /><div className="feature-shade" /><span className="hero-badge"><Sparkles size={14} /> YOUR NEXT BIG THING</span><div className="feature-overlay"><span className="feature-kicker">{featuredItem.type === "event" ? "A CHALLENGE WORTH TAKING" : "MAKE SPACE TO GROW"}</span><h2>{featuredItem.title}</h2><div className="feature-meta"><span><CalendarDays size={14} />{featuredItem.date}</span><span><MapPin size={14} />{featuredItem.location}</span></div><button onClick={() => openItem(featuredItem)}>Take a closer look <ArrowUpRight size={15} /></button></div></div><div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" /><div className="carousel-controls"><button onClick={() => setBannerIndex((index) => (index + featured.length - 1) % featured.length)} aria-label="Previous featured"><ArrowLeft size={16} /></button><span>0{bannerIndex + 1} <i>/</i> 0{featured.length}</span><button onClick={() => setBannerIndex((index) => (index + 1) % featured.length)} aria-label="Next featured"><ArrowRight size={16} /></button></div></div>
              </section>
              <section className="category-section"><div className="category-title"><span>Find your kind of thing</span><span>START WHERE YOU ARE <ArrowDown size={13} /></span></div><div className="category-strip">{categories.map(({ label, icon: Icon, value }) => <button key={label} className={`category-pill ${category === value ? "selected" : ""}`} onClick={() => { setCategory(value); document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" }); }}><span><Icon size={18} /></span>{label}<ArrowUpRight size={13} className="category-arrow" /></button>)}</div></section>
              <section className="stats-band"><span><b>Database-backed</b> published opportunities</span><i /><span><b>Curated samples</b> for browsing only</span><i /><span className="stats-note">Actions require a published listing <Sparkles size={14} /></span></section>
            </>}
            <section id="discover" className="discovery-section">
              <div className="section-heading"><div><span className="eyebrow">{path === "/jobs" ? "GOOD WORK, GOOD PEOPLE" : path === "/events" ? "A LITTLE FRIENDLY COMPETITION" : path === "/training" ? "GROW AT YOUR OWN PACE" : query ? "YOUR SEARCH, YOUR NEXT STEP" : "THERE'S MORE OUT THERE"}</span><h2>{path === "/jobs" ? "Work worth showing up for." : path === "/events" ? "A challenge with your name on it." : path === "/training" ? "Skills that open new doors." : query ? `Found something?` : "A few things we think you'll love."}</h2><p>Hand-picked opportunities for wherever you are in your journey.</p></div><div className="section-controls">{["All", "Events", "Training", "Jobs"].map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item === "Events" ? "Competitions" : item === "Training" ? "Learning" : item}</button>)}</div></div>
              {(path === "/jobs" || path === "/explore") && <div className="filter-toolbar"><div><Filter size={15} /><span>Show me</span>{["All", "Remote", "Hybrid", "On-site"].map((mode) => <button key={mode} className={jobFilter === mode ? "filter-active" : ""} onClick={() => setJobFilter(mode)}>{mode}</button>)}</div><span className="results-count">{searchResults.length} lovely possibilities</span></div>}
              <div className="opportunity-grid">{searchResults.slice(0, 6).map((item) => <OpportunityCard key={item.id} item={item} saved={saved.includes(item.id)} onSave={toggleSaved} onOpen={openItem} />)}{!searchResults.length && <div className="empty-state"><span>✳</span><h3>No matches just yet.</h3><p>Try a different search or explore another category. Your next step is still out there.</p><button onClick={() => { setQuery(""); setCategory("All"); setJobFilter("All"); }}>Show me everything</button></div>}</div>
              {searchResults.length > 6 && <button className="load-more" onClick={() => go(path === "/jobs" ? "/jobs" : "/events")}>See all opportunities <ArrowRight size={16} /></button>}
            </section>
            {(path === "/" || path === "/explore") && <>
              <section className="quote-banner"><div className="quote-mark">“</div><div><p>You don't have to have it all figured out. You just have to be open to the next good thing.</p><span>A note from your SkillConnect community <Sparkles size={13} /></span></div><button onClick={() => go("/dashboard")}>Find my next step <ArrowRight size={16} /></button></section>
              <section className="pathways-section"><div className="section-heading"><div><span className="eyebrow">LITTLE STEPS, BIG PLACES</span><h2>Where do you want to go?</h2><p>There's no one way forward. Find what feels right for you.</p></div></div><div className="pathway-grid">{[{ title: "Try something new", label: "COMPETITIONS & EVENTS", color: "pathway-lilac", icon: Trophy, to: "/events", text: "Put your ideas out there. See what happens." }, { title: "Build a new skill", label: "LEARNING & TRAINING", color: "pathway-mint", icon: GraduationCap, to: "/training", text: "Make time for the version of you you're becoming." }, { title: "Find work that fits", label: "JOBS & EARLY CAREERS", color: "pathway-peach", icon: BriefcaseBusiness, to: "/jobs", text: "Your next team might be looking for you, too." }].map(({ title, label, color, icon: Icon, to, text }) => <button key={to} className={`pathway-card ${color}`} onClick={() => go(to)}><span className="pathway-icon"><Icon size={21} /></span><span className="eyebrow">{label}</span><h3>{title}</h3><p>{text}</p><span className="pathway-link">Take a look <ArrowUpRight size={15} /></span><span className="pathway-watermark"><Icon size={118} /></span></button>)}</div></section>
            </>}
          </div>
        )}
      </main>
      <footer className="site-footer"><div className="footer-main page-container"><div className="footer-brand"><Link to="/" className="brand"><span className="brand-symbol"><Compass size={21} strokeWidth={2.5} /></span><span>skill<span>connect</span><i>.</i></span></Link><p>For the curious, the courageous,<br />and everything in between.</p><span className="footer-hello">You've got this. <Sparkles size={14} /></span></div><div className="footer-column"><span>EXPLORE</span><button onClick={() => go("/")}>Discover</button><button onClick={() => go("/events")}>Competitions</button><button onClick={() => go("/training")}>Learning</button><button onClick={() => go("/jobs")}>Jobs & internships</button></div><div className="footer-column"><span>YOUR SPACE</span><button onClick={() => go("/dashboard")}>My dashboard</button><button onClick={() => go("/messages")}>Messages</button><button onClick={() => setModal({ type: "auth", mode: "signup" })}>Join the community</button></div><div className="footer-column"><span>LET'S BUILD TOGETHER</span><button onClick={() => go("/organizer")}>For organizers</button><button onClick={() => setModal({ type: "chat" })}>Say hello</button><span className="footer-signoff">Made for what's next <span>✳</span></span></div></div><div className="footer-bottom page-container"><span>© 2026 SkillConnect. A little more possible, every day.</span><span>Made with care <span>♥</span> for every next step.</span></div></footer>

      {modal?.type === "auth" && <Overlay onClose={() => setModal(null)}><button className="dialog-close" onClick={() => setModal(null)} aria-label="Close"><X size={19} /></button><span className="dialog-icon"><Compass size={22} /></span><span className="eyebrow">{modal.mode === "login" ? "GOOD TO SEE YOU AGAIN" : "YOUR NEXT CHAPTER STARTS HERE"}</span><h2>{modal.mode === "login" ? "Welcome back." : "Make yourself at home."}</h2><p className="dialog-lede">{modal.mode === "login" ? "Pick up right where you left off." : "One little step can lead somewhere wonderful."}</p><form className="auth-form" onSubmit={submitAuth}>{modal.mode === "signup" && <label>Your name<input name="name" placeholder="How should we call you?" required /></label>}<label>Email address<input name="email" type="email" placeholder="you@example.com" required /></label><label>Password<input name="password" type="password" placeholder="At least 8 characters" minLength="8" required /></label>{modal.mode === "signup" && <label>I'm here as<select name="role"><option>Student</option><option>Trainer</option><option>Organizer</option></select></label>}<button className="primary-button full-button" type="submit">{modal.mode === "login" ? "Log in" : "Join SkillConnect"} <ArrowRight size={17} /></button></form><button className="auth-switch" onClick={() => setModal({ ...modal, mode: modal.mode === "login" ? "signup" : "login" })}>{modal.mode === "login" ? "New here? Make yourself at home." : "Already have a profile? Log in."}</button><p className="demo-note">Your account and activity are saved to your SkillConnect profile.</p></Overlay>}
      {modal?.type === "create" && <Overlay onClose={() => setModal(null)}><button className="dialog-close" onClick={() => setModal(null)} aria-label="Close"><X size={19} /></button><span className="eyebrow">A GOOD THING STARTS WITH YOU</span><h2>{modal.item ? "Give your listing a refresh." : "Share an opportunity."}</h2><p className="dialog-lede">{modal.item ? "Update the details and keep your community in the loop." : "Tell our community what's waiting on the other side."}</p><form className="auth-form" onSubmit={createOpportunity}><label>What are you sharing?<select name="type" defaultValue={modal.item?.type || "event"}><option value="event">Competition or event</option><option value="training">Training program</option><option value="job">Job opportunity</option></select></label><label>Opportunity title<input name="title" defaultValue={modal.item?.title || ""} placeholder="Give it a name people will remember" required /></label>{modal.item && <label>Listing status<select name="status" defaultValue={modal.item.status}><option value="open">Open</option><option value="closed">Closed</option><option value="draft">Draft</option></select></label>}<label>Organization<input name="company" defaultValue={modal.item?.company || ""} placeholder="Your team or organization" required /></label><label>Category<select name="category" defaultValue={modal.item?.category || "Technology"}>{["Technology", "Design", "Business", "Social Impact"].map((item) => <option key={item}>{item}</option>)}</select></label><div className="form-row"><label>Opportunity date<input name="date" type="date" defaultValue={dateInputValue(modal.item?.start_date || modal.item?.date)} required /></label><label>Apply by<input name="deadline" type="date" defaultValue={dateInputValue(modal.item?.deadline)} required /></label></div><label>Location<input name="location" defaultValue={modal.item?.location || "Online"} required /></label><label>Format<select name="mode" defaultValue={modal.item?.mode || "Online"}><option>Online</option><option>Hybrid</option><option>On-site</option><option>Remote</option></select></label><label>Duration<input name="duration" defaultValue={modal.item?.duration || ""} placeholder="e.g. 6 weeks" /></label><label>Eligibility<textarea name="eligibility" rows="2" defaultValue={modal.item?.eligibility || ""} required /></label><label>Skills (comma-separated)<input name="skills" defaultValue={modal.item?.skills?.join(", ") || ""} /></label><label>Salary or prize<input name="salary" defaultValue={modal.item?.salary || modal.item?.prize || ""} /></label><label>What's it about?<textarea name="description" rows="3" defaultValue={modal.item?.description || ""} placeholder="A few words to help people picture it..." required /></label><button className="primary-button full-button" type="submit">{modal.item ? "Save listing changes" : "Publish my listing"} <ArrowRight size={17} /></button></form></Overlay>}
      {modal?.type === "curriculum" && <Overlay onClose={() => setModal(null)}><button className="dialog-close" onClick={() => setModal(null)} aria-label="Close"><X size={19} /></button><span className="eyebrow">TRAINING CURRICULUM</span><h2>Manage course lessons.</h2><p className="dialog-lede">{modal.item?.title}. Add one lesson per line; use “title | lesson details” for optional content. Saving replaces the current curriculum.</p><form className="auth-form" onSubmit={saveCurriculum}><label>Lessons<textarea name="lessons" rows="8" defaultValue={modal.modules?.flatMap((module) => module.lessons.map((lesson) => `${lesson.title}${lesson.content ? ` | ${lesson.content}` : ""}`)).join("\n") || ""} required /></label><button className="primary-button full-button" type="submit">Save curriculum <ArrowRight size={17} /></button></form></Overlay>}
      {modal?.type === "chat" && <Overlay onClose={() => setModal(null)}><button className="dialog-close" onClick={() => setModal(null)} aria-label="Close"><X size={19} /></button><span className="eyebrow">WE'RE HERE FOR YOU</span><h2>Let's talk it through.</h2><p className="dialog-lede">Send a message to another SkillConnect member.</p><Chat messages={messages} setMessages={setMessages} message={message} setMessage={setMessage} user={user} members={members} selectedRecipient={selectedRecipient} setSelectedRecipient={setSelectedRecipient} onApiSend={user && localStorage.getItem("sc-token") ? sendApiMessage : null} onRequestLogin={() => setModal({ type: "auth", mode: "login" })} /></Overlay>}
      {modal?.type === "submit" && <Overlay onClose={() => setModal(null)}><button className="dialog-close" onClick={() => setModal(null)} aria-label="Close"><X size={19} /></button><span className="eyebrow">YOUR WORK DESERVES TO BE SEEN</span><h2>Share what you've made.</h2><p className="dialog-lede">{modal.item?.title} · Submissions close {modal.item?.deadline}</p><form className="auth-form" onSubmit={submitProject}><label>Project or file link<input name="link" type="url" defaultValue={modal.draft?.link || ""} placeholder="https://..." /></label><label>Tell us about it<textarea name="description" rows="4" defaultValue={modal.draft?.description || ""} placeholder="What did you make, and what did you learn?" required /></label><label>Attach a file<input name="file" type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.zip,.png,.jpg,.jpeg" /></label>{modal.draft?.file && <p className="form-note">Selected file retained: {modal.draft.file.name}</p>}<button className="primary-button full-button" type="submit">Send my submission <ArrowRight size={17} /></button></form></Overlay>}
      {toast && <div className="toast"><span><Check size={17} /></span>{toast}<button onClick={() => setToast("")} aria-label="Dismiss notification"><X size={15} /></button></div>}
    </div>
  );
}

function Chat({ messages, setMessages, message, setMessage, user, members, selectedRecipient, setSelectedRecipient, onApiSend, onRequestLogin }) {
  const [chatError, setChatError] = useState("");
  useEffect(() => {
    if (!onApiSend || !selectedRecipient) return undefined;
    let active = true;
    const refresh = () => listMessages(selectedRecipient)
      .then((history) => {
        if (!active) return;
        setMessages(history.map((entry) => ({
          text: entry.body,
          from: entry.sender_id === user?.id ? "you" : "member",
          time: new Date(entry.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        })));
        setChatError("");
      })
      .catch((error) => { if (active) setChatError(errorMessage(error)); });
    refresh();
    const interval = setInterval(refresh, 8000);
    return () => { active = false; clearInterval(interval); };
  }, [onApiSend, selectedRecipient, setMessages, user?.id]);

  const send = async (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text) return;
    if (!onApiSend) {
      setChatError("Sign in to send messages that are saved to your account.");
      onRequestLogin();
      return;
    }
    if (!selectedRecipient) {
      setChatError("Select a member before sending a message.");
      return;
    }
    try {
      await onApiSend(text, selectedRecipient);
      setChatError("");
    } catch (error) {
      setChatError(errorMessage(error));
      return;
    }
    setMessage("");
  };
  return (
    <div className="chat-panel">
      <div className="chat-heading">
        <span className="chat-avatar">SC</span>
        <span><b>SkillConnect community</b><small><i />{onApiSend ? "Conversation updates every 8 seconds" : "Sign in to message members"}</small></span>
        {members.length > 0 && <label className="chat-recipient-label">WITH<select className="chat-recipient" value={selectedRecipient} onChange={(event) => setSelectedRecipient(event.target.value)}>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>}
      </div>
      {onApiSend && members.length === 0 && <div className="chat-hint">There are no other members to message just yet. Check back as the community grows.</div>}
      {!onApiSend && <div className="chat-hint">Sign in to view saved conversation history and send messages.</div>}
      <div className="chat-messages">{messages.map((entry, index) => <div key={`${entry.time}-${index}`} className={`chat-message ${entry.from === "you" ? "sent" : ""}`}><span>{entry.text}</span><small>{entry.time}</small></div>)}</div>
      {chatError && <p className="chat-error" role="alert">{chatError}</p>}
      {!onApiSend && <button className="primary-button chat-sign-in" type="button" onClick={onRequestLogin}>Sign in to chat <ArrowRight size={15} /></button>}
      <form className="chat-compose" onSubmit={send}>
        <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder={onApiSend ? "Write something..." : "Sign in to send a message"} aria-label="Write a message" disabled={!onApiSend || members.length === 0} />
        <button aria-label="Send message" type="submit" disabled={!onApiSend || members.length === 0}><Send size={17} /></button>
      </form>
    </div>
  );
}

function Dashboard({ user, onLogin, onLogout, onNavigate, items, registrations, enrollments, applications, saved, activity, submissions, upcomingDeadlines, onOpen, admin, onCreate, onEdit, onManageCurriculum, onDelete }) {
  return <PersistedDashboard user={user} onLogin={onLogin} onLogout={onLogout} onNavigate={onNavigate} items={items} registrations={registrations} enrollments={enrollments} applications={applications} saved={saved} activity={activity} submissions={submissions} upcomingDeadlines={upcomingDeadlines} onOpen={onOpen} admin={admin} onCreate={onCreate} onEdit={onEdit} onManageCurriculum={onManageCurriculum} onDelete={onDelete} />;
}

function PersistedDashboard({
  user,
  onLogin,
  onLogout,
  onNavigate,
  items,
  registrations,
  enrollments,
  applications,
  saved,
  activity,
  submissions,
  upcomingDeadlines,
  onOpen,
  admin,
  onCreate,
  onEdit,
  onManageCurriculum,
  onDelete,
}) {
  const [tab, setTab] = useState("Overview");
  if (!user) return <div className="dashboard-locked page-container"><span className="dialog-icon"><Compass size={24} /></span><span className="eyebrow">YOUR JOURNEY, ALL IN ONE PLACE</span><h1>A little more room<br />to <em>make it yours.</em></h1><p>Sign in to load your registrations, learning progress, applications, and saved opportunities.</p><button className="primary-button" onClick={onLogin}>Sign in to your profile <ArrowRight size={17} /></button></div>;
  if (admin && String(user.role).toLowerCase() !== "admin") return <div className="dashboard-locked page-container"><span className="dialog-icon"><BriefcaseBusiness size={23} /></span><span className="eyebrow">A PRIVATE COMMUNITY SPACE</span><h1>This view is for<br /><em>the people who help.</em></h1><p>Admin tools are available to verified SkillConnect administrators only.</p><button className="primary-button" onClick={() => onNavigate("/dashboard")}>Back to my dashboard <ArrowRight size={17} /></button></div>;

  const adminTabs = ["Overview", "Listings", "Participants", "Users", "Submissions", "Analytics"];
  const userTabs = ["Overview", "My events", "My learning", "Applications", "Saved", "Submissions"];
  const tabs = admin ? adminTabs : userTabs;
  const selectedIds = tab === "My events"
    ? registrations
    : tab === "My learning"
      ? enrollments
      : tab === "Applications"
        ? applications
        : tab === "Saved"
          ? saved
          : [...registrations, ...enrollments, ...applications];
  const selectedItems = items.filter((item) => selectedIds.includes(String(item.id)));
  const activityKind = tab === "My events" ? "registration" : tab === "My learning" ? "enrollment" : tab === "Applications" ? "application" : null;
  const visibleActivity = activityKind ? activity.filter((entry) => entry.kind === activityKind) : activity;

  return <div className="dashboard-page page-container">
    <div className="dashboard-welcome"><div><span className="eyebrow">{admin ? "A GOOD PLACE TO GET THINGS DONE" : "YOUR JOURNEY, ALL IN ONE PLACE"}</span><h1>{admin ? "The community, at a glance." : <>Good to see you, <em>{user.name?.split(" ")[0]}.</em></>}</h1><p>{admin ? "Live activity from the SkillConnect database." : "A little progress adds up. Here's where you are."}</p></div><div className="dashboard-user"><span className="avatar avatar-large">{user.name?.slice(0, 1)}</span><span><b>{user.name}</b><small>{admin ? "Administrator" : user.role}</small></span></div></div>
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar"><span className="eyebrow">YOUR SPACE</span>{tabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item === "Overview" ? <Compass size={17} /> : item === "My events" || item === "Participants" ? <CalendarDays size={17} /> : item === "My learning" ? <GraduationCap size={17} /> : item === "Applications" ? <BriefcaseBusiness size={17} /> : item === "Saved" ? <Heart size={17} /> : item === "Analytics" ? <ArrowUpRight size={17} /> : <Sparkles size={17} />}{item}{item === "Overview" && <ChevronRight className="side-chevron" size={15} />}</button>)}<div className="sidebar-bottom"><span>Need a hand?</span><button onClick={() => onNavigate("/messages")}><MessageCircle size={16} />Talk to our team</button><button className="role-toggle" onClick={() => onNavigate(admin ? "/dashboard" : "/organizer")}>{admin ? "Switch to my profile" : "Open organizer view"} <ArrowUpRight size={14} /></button><button className="role-toggle" onClick={onLogout}>Sign out</button></div></aside>
      <div className="dashboard-content">
        {admin ? (
          <PersistedAdminPanel tab={tab} onCreate={onCreate} onEdit={onEdit} onManageCurriculum={onManageCurriculum} onDelete={onDelete} />
        ) : tab === "Overview" ? (
          <>
            <div className="dashboard-stats">{[[registrations.length, "Events I'm joining", "Current registrations", Trophy], [enrollments.length, "Learning paths", "Current enrollments", GraduationCap], [applications.length, "Applications", "Current applications", BriefcaseBusiness], [saved.length, "Saved for later", "Saved to your account", Heart]].map(([number, label, note, Icon]) => <div className="dashboard-stat" key={label}><span><Icon size={17} /></span><b>{number}</b><strong>{label}</strong><small>{note}</small></div>)}</div>
            <div className="dash-section-title"><div><span className="eyebrow">YOUR NEXT FEW THINGS</span><h2>Look how far you've come.</h2></div></div>
            {visibleActivity.length ? <div className="dashboard-opportunities">{visibleActivity.slice(0, 6).map((record) => {
              const item = items.find((entry) => String(entry.id) === String(record.opportunity_id));
              if (!item) return null;
              return <div key={record.id}><OpportunityCard item={item} saved={saved.includes(String(item.id))} onSave={() => {}} onOpen={onOpen} compact /><p className="dashboard-record-status">{record.status}{record.kind === "enrollment" ? ` · ${record.progress}% complete` : ""}</p></div>;
            })}</div> : <div className="dashboard-empty"><span className="empty-illustration"><Compass size={28} /></span><div><b>Your next good thing is out there.</b><p>Start with one small step. We'll keep the rest organized for you.</p></div><button onClick={() => onNavigate("/")}>Explore opportunities <ArrowRight size={15} /></button></div>}
            <div className="dash-deadline"><div className="deadline-calendar"><CalendarDays size={20} /></div><div><span className="eyebrow">UPCOMING DEADLINES</span>{upcomingDeadlines.length ? upcomingDeadlines.slice(0, 3).map((entry) => <p key={`${entry.opportunity_id}-${entry.kind}`}><b>{entry.opportunity_title}</b> · {entry.kind} · {displayDate(entry.deadline)}</p>) : <p>No upcoming deadlines on your current activity.</p>}</div><button onClick={() => setTab("Saved")}>Check saved items <ArrowRight size={15} /></button></div>
          </>
        ) : tab === "Submissions" ? (
          <section className="admin-panel"><div className="dash-section-title"><div><span className="eyebrow">YOUR PROJECTS</span><h2>Submission status and feedback.</h2></div></div>{submissions.length ? <div className="admin-table"><div className="table-header"><span>OPPORTUNITY</span><span>SUBMITTED</span><span>STATUS</span><span>FEEDBACK</span></div>{submissions.map((entry) => <div className="table-row" key={entry.id}><span><b>{entry.opportunity_title}</b><small>{entry.link || entry.attachment || entry.description}</small></span><span>{new Date(entry.updated_at).toLocaleDateString()}</span><span>{entry.status}</span><span>{entry.feedback || "Waiting for organizer feedback."}</span></div>)}</div> : <div className="admin-empty">Your submissions and organizer feedback will appear here.</div>}</section>
        ) : (
          <>
            <div className="dash-section-title"><div><span className="eyebrow">YOUR JOURNEY, AT YOUR PACE</span><h2>{tab === "My events" ? "Event registrations." : tab === "My learning" ? "Your learning paths." : tab === "Applications" ? "Your job applications." : "Saved opportunities."}</h2></div></div>
            {tab === "Saved" ? selectedItems.length ? <div className="dashboard-opportunities">{selectedItems.map((item) => <OpportunityCard key={item.id} item={item} saved onSave={() => {}} onOpen={onOpen} compact />)}</div> : <div className="admin-empty">You have not saved any opportunities yet.</div> : visibleActivity.length ? <div className="admin-table"><div className="table-header"><span>OPPORTUNITY</span><span>DEADLINE</span><span>STATUS</span><span>{tab === "My learning" ? "PROGRESS" : "UPDATED"}</span></div>{visibleActivity.map((entry) => <div className="table-row" key={entry.id}><span><b>{entry.opportunity_title}</b><small>{entry.opportunity_type}</small></span><span>{entry.deadline ? displayDate(entry.deadline) : "No deadline"}</span><span>{entry.status}</span><span>{tab === "My learning" ? `${entry.progress}%` : new Date(entry.created_at).toLocaleDateString()}</span></div>)}</div> : <div className="admin-empty">Your activity will appear here after you join a published opportunity.</div>}
          </>
        )}
      </div>
    </div>
  </div>;
}

function PersistedAdminPanel({ tab, onCreate, onEdit, onManageCurriculum, onDelete }) {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [panelError, setPanelError] = useState("");
  const [feedbackDrafts, setFeedbackDrafts] = useState({});

  useEffect(() => {
    if (!localStorage.getItem("sc-token")) {
      setPanelError("Sign in with an administrator account to see live records.");
      return undefined;
    }
    let active = true;
    const request = tab === "Overview" || tab === "Analytics"
      ? getAdminDashboard
      : tab === "Listings"
        ? listMyOpportunities
        : tab === "Participants"
          ? listParticipations
          : tab === "Users"
            ? listAccounts
            : tab === "Submissions"
              ? listSubmissions
              : null;
    if (!request) return undefined;
    request()
      .then((result) => {
        if (!active) return;
        if (tab === "Overview" || tab === "Analytics") setStats(result);
        else setRows(tab === "Listings" ? result.map(fromApiOpportunity) : result);
        setPanelError("");
      })
      .catch((error) => { if (active) setPanelError(errorMessage(error)); });
    return () => { active = false; };
  }, [tab]);

  const updateParticipation = async (record, status) => {
    try {
      const updated = await reviewParticipation(record.id, status);
      setRows((current) => current.map((entry) => entry.id === updated.id ? { ...entry, ...updated } : entry));
    } catch (error) {
      setPanelError(errorMessage(error));
    }
  };
  const updateRole = async (account, role) => {
    try {
      const updated = await updateAccountRole(account.id, role);
      setRows((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
    } catch (error) {
      setPanelError(errorMessage(error));
    }
  };
  const updateSubmission = async (submission, status) => {
    try {
      const feedback = String(feedbackDrafts[submission.id] ?? submission.feedback ?? "").trim();
      if (!feedback) {
        setPanelError("Add feedback before reviewing a submission.");
        return;
      }
      const updated = await reviewSubmission(submission.id, status, feedback);
      setRows((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
      setPanelError("");
    } catch (error) {
      setPanelError(errorMessage(error));
    }
  };
  const titles = { Participants: "Participant management.", Users: "User accounts and roles.", Submissions: "Participant work and feedback.", Analytics: "Live platform activity." };

  return <section className="admin-panel" data-tab={tab}>
    <div className="dash-section-title"><div><span className="eyebrow">YOUR COMMUNITY, AT A GLANCE</span><h2>{tab === "Overview" ? "Live platform overview." : tab === "Listings" ? "Listings, all in one place." : titles[tab]}</h2></div>{(tab === "Overview" || tab === "Listings") && <button className="primary-button small-button" onClick={onCreate}>{tab === "Overview" ? "New listing" : "Create listing"} <ArrowRight size={15} /></button>}</div>
    {panelError && <p className="admin-panel-error" role="alert">{panelError}</p>}
    {(tab === "Overview" || tab === "Analytics") && stats && <>
      <div className="dashboard-stats">{[[stats.users, "Community members", "Accounts in the database", Users], [stats.events, "Events", `${stats.registrations} registrations`, Trophy], [stats.training, "Training programs", `${stats.enrollments} enrollments`, GraduationCap], [stats.jobs, "Jobs", `${stats.applications} applications`, BriefcaseBusiness]].map(([number, label, note, Icon]) => <div className="dashboard-stat" key={label}><span><Icon size={17} /></span><b>{number}</b><strong>{label}</strong><small>{note}</small></div>)}</div>
      <div className="admin-activity-list">{[[stats.pending_participations, "Pending registrations or applications"], [stats.approved_applications, "Approved job applications"], [stats.rejected_applications, "Rejected job applications"], [stats.total_submissions, "Total project submissions"], [stats.pending_submissions, "Submissions awaiting review"], [stats.open_opportunities, "Open opportunities"], [stats.closing_soon, "Opportunities closing within three days"], [stats.closed_opportunities, "Closed opportunities"]].map(([value, label]) => <div key={label}><span className="activity-dot">{value}</span><p>{label}</p><span>Live</span></div>)}</div>
    </>}
    {tab === "Listings" && <div className="admin-table"><div className="table-header"><span>OPPORTUNITY</span><span>TYPE</span><span>DEADLINE</span><span>STATUS</span><span>MANAGE</span></div>{rows.map((item) => <div key={item.id} className="table-row"><span><b>{item.title}</b><small>{item.company}</small></span><span>{item.type}</span><span>{item.deadline || "No deadline"}</span><span className="table-status">{deadlineStatus(item)}</span><span className="table-actions"><button onClick={() => onEdit(item)}>Edit</button>{item.type === "training" && <button onClick={() => onManageCurriculum(item)}>Curriculum</button>}<button onClick={() => onDelete(item)}>Remove</button></span></div>)}{!rows.length && !panelError && <div className="admin-empty">No published listings are available for this account.</div>}</div>}
    {tab === "Participants" && <div className="admin-table"><div className="table-header"><span>MEMBER</span><span>OPPORTUNITY</span><span>TYPE</span><span>DATE</span><span>STATUS</span><span>REVIEW</span></div>{rows.map((record) => <div className="table-row" key={record.id}><span><b>{record.account_name || `Member #${record.account_id}`}</b><small>{record.account_email}</small></span><span>{record.opportunity_title || `Opportunity #${record.opportunity_id}`}</span><span>{record.kind}</span><span>{new Date(record.created_at).toLocaleDateString()}</span><span className="table-status">{record.status}</span><span className="table-actions"><button disabled={record.status === "approved"} onClick={() => updateParticipation(record, "approved")}>Approve</button><button disabled={record.status === "rejected"} onClick={() => updateParticipation(record, "rejected")}>Reject</button></span></div>)}{!rows.length && !panelError && <div className="admin-empty">No participants yet.</div>}</div>}
    {tab === "Users" && <div className="admin-table"><div className="table-header"><span>MEMBER</span><span>EMAIL</span><span>ROLE</span><span>JOINED</span><span>ACCESS</span></div>{rows.map((account) => <div className="table-row" key={account.id}><span><b>{account.name}</b></span><span>{account.email}</span><span>{account.role}</span><span>{new Date(account.created_at).toLocaleDateString()}</span><span><select className="role-select" value={account.role} onChange={(event) => updateRole(account, event.target.value)} aria-label={`Role for ${account.name}`}><option value="student">Student</option><option value="trainer">Trainer</option><option value="organizer">Organizer</option><option value="admin">Admin</option></select></span></div>)}</div>}
    {tab === "Submissions" && <div className="admin-table"><div className="table-header"><span>WORK SHARED</span><span>MEMBER</span><span>RECEIVED</span><span>STATUS</span><span>FEEDBACK</span><span>REVIEW</span></div>{rows.map((submission) => <div className="table-row" key={submission.id}><span><b>Opportunity #{submission.opportunity_id}</b><small>{submission.link || submission.attachment || submission.description}</small></span><span>Member #{submission.account_id}</span><span>{new Date(submission.created_at).toLocaleDateString()}</span><span>{submission.status}</span><span><textarea aria-label={`Feedback for submission ${submission.id}`} value={feedbackDrafts[submission.id] ?? submission.feedback ?? ""} onChange={(event) => setFeedbackDrafts((drafts) => ({ ...drafts, [submission.id]: event.target.value }))} placeholder="Write feedback for the student" rows={2} /></span><span className="table-actions"><button disabled={submission.status !== "submitted"} onClick={() => updateSubmission(submission, "approved")}>Approve</button><button disabled={submission.status !== "submitted"} onClick={() => updateSubmission(submission, "rejected")}>Request changes</button></span></div>)}{!rows.length && !panelError && <div className="admin-empty">No submissions yet.</div>}</div>}
  </section>;
}

function OrganizerDashboard({ user, onCreate, onEdit, onManageCurriculum, onDelete, onLogin, onLogout }) {
  const [listings, setListings] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [error, setError] = useState("");
  useEffect(() => {
    if (!user || !localStorage.getItem("sc-token")) return undefined;
    let active = true;
    Promise.all([listMyOpportunities(), listParticipations(), listSubmissions()])
      .then(([opportunitiesResult, participantsResult, submissionsResult]) => {
        if (!active) return;
        setListings(opportunitiesResult.map(fromApiOpportunity));
        setParticipants(participantsResult);
        setSubmissions(submissionsResult);
        setError("");
      })
      .catch((requestError) => { if (active) setError(errorMessage(requestError)); });
    return () => { active = false; };
  }, [user?.id]);
  const updateParticipation = async (record, status) => {
    try {
      const updated = await reviewParticipation(record.id, status);
      setParticipants((current) => current.map((entry) => entry.id === updated.id ? { ...entry, ...updated } : entry));
      setError("");
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };
  const updateSubmission = async (submission, status) => {
    const feedback = String(feedbackDrafts[submission.id] ?? submission.feedback ?? "").trim();
    if (!feedback) {
      setError("Add feedback before reviewing a submission.");
      return;
    }
    try {
      const updated = await reviewSubmission(submission.id, status, feedback);
      setSubmissions((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
      setError("");
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };
  if (!user) return <div className="dashboard-locked page-container"><span className="eyebrow">YOUR ORGANIZER SPACE</span><h1>Manage opportunities with real participant data.</h1><p>Sign in as an organizer or trainer to continue.</p><button className="primary-button" onClick={onLogin}>Sign in <ArrowRight size={17} /></button></div>;
  if (!["admin", "organizer", "trainer"].includes(String(user.role).toLowerCase())) return <div className="dashboard-locked page-container"><span className="eyebrow">YOUR ORGANIZER SPACE</span><h1>Organizer tools are role-restricted.</h1><p>Use an organizer or trainer account to create listings and manage participants.</p><button className="primary-button" onClick={() => onCreate()}>Continue <ArrowRight size={17} /></button></div>;
  return <div className="organizer-page page-container">
    <div className="organizer-hero"><div><span className="eyebrow">YOUR ORGANIZER WORKSPACE</span><h1>Help your community<br />find its <em>next step.</em></h1><p>Manage your published opportunities, participants, and submissions in one place.</p><button className="primary-button" onClick={onCreate}>Create a listing <ArrowRight size={17} /></button><button className="logout-button organizer-sign-out" onClick={onLogout}>Sign out</button></div><div className="organizer-art"><div className="art-shape shape-one" /><div className="art-shape shape-two" /><Users size={100} strokeWidth={1.2} /></div></div>
    {error && <p className="admin-panel-error" role="alert">{error}</p>}
    <div className="dashboard-stats">{[[listings.length, "Your listings"], [participants.filter((entry) => entry.kind === "registration").length, "Event registrations"], [participants.filter((entry) => entry.kind === "enrollment").length, "Training enrollments"], [participants.filter((entry) => entry.kind === "application").length, "Job applications"], [submissions.length, "Submissions"]].map(([count, label]) => <div className="dashboard-stat" key={label}><b>{count}</b><strong>{label}</strong></div>)}</div>
    <section className="admin-panel"><div className="dash-section-title"><div><span className="eyebrow">YOUR OPPORTUNITIES</span><h2>Listings, participants, and work.</h2></div></div>{listings.length ? <div className="admin-table"><div className="table-header"><span>OPPORTUNITY</span><span>TYPE</span><span>PARTICIPANTS</span><span>SUBMISSIONS</span><span>STATUS</span><span>MANAGE</span></div>{listings.map((item) => {
      const relatedParticipants = participants.filter((entry) => String(entry.opportunity_id) === String(item.id));
      const relatedSubmissions = submissions.filter((entry) => String(entry.opportunity_id) === String(item.id));
      return <div key={item.id} className="table-row"><span><b>{item.title}</b><small>{item.company}</small></span><span>{item.type}</span><span>{relatedParticipants.length}</span><span>{relatedSubmissions.length}</span><span>{deadlineStatus(item)}</span><span className="table-actions"><button onClick={() => onEdit(item)}>Edit</button>{item.type === "training" && <button onClick={() => onManageCurriculum(item)}>Curriculum</button>}<button onClick={() => onDelete(item)}>Remove</button></span></div>;
    })}</div> : <div className="admin-empty">Your listings will appear here after they are published.</div>}
      <div className="dash-section-title"><div><span className="eyebrow">REGISTRATION AND APPLICATION REVIEW</span><h2>Your participants.</h2></div></div>
      {participants.length ? <div className="admin-table"><div className="table-header"><span>MEMBER</span><span>OPPORTUNITY</span><span>TYPE</span><span>STATUS</span><span>REVIEW</span></div>{participants.map((record) => <div className="table-row" key={record.id}><span><b>{record.account_name || `Member #${record.account_id}`}</b><small>{record.account_email}</small></span><span>{record.opportunity_title || `Opportunity #${record.opportunity_id}`}</span><span>{record.kind}</span><span>{record.status}</span><span className="table-actions"><button disabled={record.status === "approved"} onClick={() => updateParticipation(record, "approved")}>Approve</button><button disabled={record.status === "rejected"} onClick={() => updateParticipation(record, "rejected")}>Reject</button></span></div>)}</div> : <div className="admin-empty">No participants have registered, enrolled, or applied yet.</div>}
      <div className="dash-section-title"><div><span className="eyebrow">SUBMISSION REVIEW</span><h2>Participant work and feedback.</h2></div></div>
      {submissions.length ? <div className="admin-table"><div className="table-header"><span>WORK SHARED</span><span>MEMBER</span><span>STATUS</span><span>FEEDBACK</span><span>REVIEW</span></div>{submissions.map((submission) => <div className="table-row" key={submission.id}><span><b>Opportunity #{submission.opportunity_id}</b><small>{submission.link || submission.attachment || submission.description}</small></span><span>Member #{submission.account_id}</span><span>{submission.status}</span><span><textarea aria-label={`Feedback for submission ${submission.id}`} value={feedbackDrafts[submission.id] ?? submission.feedback ?? ""} onChange={(event) => setFeedbackDrafts((drafts) => ({ ...drafts, [submission.id]: event.target.value }))} placeholder="Write feedback for the student" rows={2} /></span><span className="table-actions"><button disabled={submission.status !== "submitted"} onClick={() => updateSubmission(submission, "approved")}>Approve</button><button disabled={submission.status !== "submitted"} onClick={() => updateSubmission(submission, "rejected")}>Request changes</button></span></div>)}</div> : <div className="admin-empty">No participant submissions yet.</div>}
    </section>
  </div>;
}

function AdminPanel({ tab, items, onCreate, onEdit, onDelete }) {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [panelError, setPanelError] = useState("");
  useEffect(() => {
    if (!localStorage.getItem("sc-token")) {
      setRows([]);
      setPanelError("Sign in with a verified administrator account to see live records.");
      return undefined;
    }
    let active = true;
    const request = tab === "Overview" ? getAdminDashboard : tab === "Participants" ? listParticipations : tab === "Users" ? listAccounts : tab === "Submissions" ? listSubmissions : null;
    if (!request) return undefined;
    request()
      .then((result) => {
        if (!active) return;
        if (tab === "Overview") setStats(result);
        else setRows(result);
        setPanelError("");
      })
      .catch((error) => { if (active) setPanelError(errorMessage(error)); });
    return () => { active = false; };
  }, [tab]);

  const updateParticipation = async (record, nextStatus) => {
    try {
      const updated = await reviewParticipation(record.id, nextStatus);
      setRows((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
    } catch (error) {
      setPanelError(errorMessage(error));
    }
  };
  const updateRole = async (account, nextRole) => {
    try {
      const updated = await updateAccountRole(account.id, nextRole);
      setRows((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
    } catch (error) {
      setPanelError(errorMessage(error));
    }
  };
  const updateSubmission = async (submission, nextStatus) => {
    try {
      const feedback = nextStatus === "approved" ? "Approved. Thank you for sharing your work." : "Please review the organizer feedback and submit an update.";
      const updated = await reviewSubmission(submission.id, nextStatus, feedback);
      setRows((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
    } catch (error) {
      setPanelError(errorMessage(error));
    }
  };

  if (tab === "Listings") return <div className="admin-panel"><div className="dash-section-title"><div><span className="eyebrow">YOUR OPPORTUNITIES</span><h2>Listings, all in one place.</h2></div><button className="primary-button small-button" onClick={onCreate}>New listing <ArrowRight size={15} /></button></div><div className="admin-table"><div className="table-header"><span>OPPORTUNITY</span><span>TYPE</span><span>DEADLINE</span><span>INTEREST</span><span>STATUS</span><span>MANAGE</span></div>{items.map((item) => <div key={item.id} className="table-row"><span><b>{item.title}</b><small>{item.company}</small></span><span>{item.type}</span><span>{item.deadline}</span><span>{item.applicants}</span><span className="table-status"><i />Open</span><span className="table-actions"><button onClick={() => onEdit(item)}>Edit</button><button onClick={() => onDelete(item)}>Remove</button></span></div>)}</div></div>;
  if (tab === "Overview") return <div className="admin-panel" data-tab="Overview">
    <span className="eyebrow">YOUR COMMUNITY, AT A GLANCE</span>
    <h2>The community, at a glance.</h2>
    {panelError && <p className="admin-panel-error" role="alert">{panelError}</p>}
    {stats && <><div className="dashboard-stats">{[[stats.users, "Community members", "People growing together", Users], [stats.events, "Live competitions", `${stats.registrations} registrations`, Trophy], [stats.training, "Learning cohorts", `${stats.enrollments} enrollments`, GraduationCap], [stats.jobs, "Open opportunities", `${stats.applications} applications`, BriefcaseBusiness]].map(([number, label, note, Icon]) => <div className="dashboard-stat" key={label}><span><Icon size={17} /></span><b>{number}</b><strong>{label}</strong><small>{note}</small></div>)}</div><div className="dash-deadline"><div className="deadline-calendar"><Sparkles size={20} /></div><div><span className="eyebrow">NEEDS A LOOK</span><b>{stats.pending_submissions} submissions waiting for review</b><p>Give participants thoughtful feedback on the work they've shared.</p></div></div></>}
  </div>;
  const titles = { Participants: "People who make this possible.", Users: "The people behind the possibilities.", Submissions: "A closer look at the good work.", Analytics: "The story your numbers are telling." };
  return <div className="admin-panel" data-tab={tab}>
    <span className="eyebrow">YOUR COMMUNITY, AT A GLANCE</span>
    <h2>{titles[tab]}</h2>
    {panelError && <p className="admin-panel-error" role="alert">{panelError}</p>}
    {tab === "Participants" && <div className="admin-table"><div className="table-header"><span>MEMBER</span><span>OPPORTUNITY</span><span>TYPE</span><span>DATE</span><span>STATUS</span><span>REVIEW</span></div>{rows.map((record) => { const item = items.find((entry) => String(entry.id) === String(record.opportunity_id)); return <div className="table-row" key={record.id}><span><b>Member #{record.account_id}</b></span><span>{item?.title || `Opportunity #${record.opportunity_id}`}</span><span>{record.kind}</span><span>{new Date(record.created_at).toLocaleDateString()}</span><span className="table-status">{record.status}</span><span className="table-actions"><button onClick={() => updateParticipation(record, "approved")}>Approve</button><button onClick={() => updateParticipation(record, "rejected")}>Reject</button></span></div>; })}{!rows.length && !panelError && <div className="admin-empty">No registrations need a decision just now.</div>}</div>}
    {tab === "Users" && <div className="admin-table"><div className="table-header"><span>MEMBER</span><span>EMAIL</span><span>ROLE</span><span>JOINED</span><span>STATUS</span><span>ACCESS</span></div>{rows.map((account) => <div className="table-row" key={account.id}><span><b>{account.name}</b></span><span>{account.email}</span><span>{account.role}</span><span>{new Date(account.created_at).toLocaleDateString()}</span><span className="table-status"><i />Active</span><span><select className="role-select" value={account.role} onChange={(event) => updateRole(account, event.target.value)} aria-label={`Role for ${account.name}`}><option value="student">Student</option><option value="trainer">Trainer</option><option value="organizer">Organizer</option><option value="admin">Admin</option></select></span></div>)}{!rows.length && !panelError && <div className="admin-empty">No members yet. They will appear here after signup.</div>}</div>}
    {tab === "Submissions" && <div className="admin-table"><div className="table-header"><span>WORK SHARED</span><span>MEMBER</span><span>RECEIVED</span><span>STATUS</span><span>FEEDBACK</span><span>REVIEW</span></div>{rows.map((submission) => { const item = items.find((entry) => String(entry.id) === String(submission.opportunity_id)); return <div className="table-row" key={submission.id}><span><b>{item?.title || `Opportunity #${submission.opportunity_id}`}</b><small>{submission.link || submission.attachment || submission.description}</small></span><span>Member #{submission.account_id}</span><span>{new Date(submission.created_at).toLocaleDateString()}</span><span>{submission.status}</span><span>{submission.feedback || "—"}</span><span className="table-actions"><button onClick={() => updateSubmission(submission, "approved")}>Approve</button><button onClick={() => updateSubmission(submission, "rejected")}>Request changes</button></span></div>; })}{!rows.length && !panelError && <div className="admin-empty">No submissions need your attention just now.</div>}</div>}
    {tab === "Analytics" && <div className="admin-activity-list">{["Opportunities are connecting people across cities.", "Technology and design are this month's most explored paths.", "Use the overview cards to see registrations, applications, and pending work."].map((text, index) => <div key={text}><span className="activity-dot">{index + 1}</span><p>{text}</p><span>{index ? "Today" : "Live"}</span></div>)}</div>}
  </div>;
}
