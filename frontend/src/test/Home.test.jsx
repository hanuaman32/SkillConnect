import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import AppRoutes from "../routes/AppRoutes.jsx";
import * as platformService from "../services/platformService.js";

vi.mock("../services/platformService.js", () => ({
  completeLesson: vi.fn(),
  createOpportunity: vi.fn(),
  deleteOpportunity: vi.fn(),
  getAdminDashboard: vi.fn().mockResolvedValue({}),
  getCurrentAccount: vi.fn().mockResolvedValue({ id: 5, name: "Taylor Reed", email: "taylor@example.com", role: "student" }),
  getCurriculum: vi.fn().mockResolvedValue([]),
  getMyDashboard: vi.fn().mockResolvedValue({ activity: [], submissions: [], upcoming_deadlines: [], lesson_progress: [] }),
  listAccounts: vi.fn().mockResolvedValue([]),
  listMembers: vi.fn().mockResolvedValue([]),
  listMessages: vi.fn().mockResolvedValue([]),
  listMyActivity: vi.fn().mockResolvedValue([]),
  listMyOpportunities: vi.fn().mockResolvedValue([]),
  listOpportunities: vi.fn().mockResolvedValue([]),
  listParticipations: vi.fn().mockResolvedValue([]),
  listSavedOpportunities: vi.fn().mockResolvedValue([]),
  listSubmissions: vi.fn().mockResolvedValue([]),
  recordAction: vi.fn().mockResolvedValue({ id: 1, status: "pending", kind: "registration", created_at: "2098-01-01T00:00:00Z" }),
  reviewParticipation: vi.fn(),
  reviewSubmission: vi.fn(),
  saveCurriculum: vi.fn(),
  saveOpportunity: vi.fn(),
  sendMessage: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn().mockRejectedValue(new Error("offline")),
  submitWork: vi.fn(),
  updateAccountRole: vi.fn(),
  updateOpportunity: vi.fn(),
  updateTrainingProgress: vi.fn(),
  uploadFile: vi.fn(),
  unsaveOpportunity: vi.fn(),
}));

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

const publishedEvent = () => ({
  id: 42,
  type: "event",
  title: "Published Event",
  company: "SkillConnect",
  category: "Technology",
  description: "A published event with a complete description.",
  eligibility: "Open to all students.",
  location: "Online",
  mode: "Online",
  start_date: "2098-01-15",
  deadline: "2098-01-01",
  duration: null,
  trainer: null,
  salary: null,
  image_url: null,
  skills: [],
  status: "open",
});

const publishedTraining = () => ({
  ...publishedEvent(),
  id: 43,
  type: "training",
  title: "Published Training",
});

const waitForOpportunityLoad = async () => {
  await waitFor(() => expect(platformService.listOpportunities).toHaveBeenCalled());
  await act(async () => {
    await platformService.listOpportunities.mock.results[0].value;
  });
};

describe("SkillConnect discovery", () => {
  it("renders opportunity discovery and useful categories", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(await screen.findByRole("heading", { name: /find the thing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All opportunities" })).toBeInTheDocument();
    expect(screen.getAllByText("Design Forward Challenge 2026")).not.toHaveLength(0);
  });

  it("renders the not-found page for unknown routes", () => {
    render(
      <MemoryRouter initialEntries={["/nope"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });

  it("filters opportunity cards as the user searches", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    await waitForOpportunityLoad();
    fireEvent.change(screen.getByRole("textbox", { name: /search opportunities/i }), { target: { value: "UX Design" } });
    expect(screen.getByText("UX Design: From Insight to Interface")).toBeInTheDocument();
    expect(screen.queryByText("Future Builders Hackathon")).not.toBeInTheDocument();
  });

  it("does not claim signup succeeded when the API rejects it", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /join free/i }));
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Taylor Reed" } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "taylor@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "thoughtful123" } });
    fireEvent.click(screen.getByRole("button", { name: /join skillconnect/i }));

    await waitFor(() => expect(platformService.signUp).toHaveBeenCalled());
    expect(localStorage.getItem("sc-token")).toBeNull();
    expect(screen.getByRole("button", { name: /join skillconnect/i })).toBeInTheDocument();
  });

  it("does not report a persisted action for a curated demo opportunity", async () => {
    render(
      <MemoryRouter initialEntries={["/events/design-forward"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    fireEvent.click(await screen.findByRole("button", { name: /register for free/i }));

    expect(await screen.findByText(/curated example is for browsing/i)).toBeInTheDocument();
    expect(platformService.recordAction).not.toHaveBeenCalled();
  });

  it("records a published event registration through the API", async () => {
    platformService.listOpportunities.mockResolvedValueOnce([publishedEvent()]);
    localStorage.setItem("sc-token", "test-token");

    render(
      <MemoryRouter initialEntries={["/events/42"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    fireEvent.click(await screen.findByRole("button", { name: /register for free/i }));

    await waitFor(() => expect(platformService.recordAction).toHaveBeenCalledWith(42, "registration"));
    expect(await screen.findByRole("button", { name: /pending/i })).toBeInTheDocument();
    expect(screen.getByText(/registration submitted for organizer approval/i)).toBeInTheDocument();
  });

  it("restores a submission draft after signup and persists it", async () => {
    platformService.listOpportunities.mockResolvedValueOnce([publishedEvent()]);
    platformService.signUp.mockResolvedValueOnce({
      access_token: "account-token",
      account: { id: 8, name: "Taylor Reed", email: "taylor@example.com", role: "student" },
    });
    platformService.submitWork.mockResolvedValueOnce({
      id: 16,
      opportunity_id: 42,
      status: "submitted",
      created_at: "2098-01-01T00:00:00Z",
      updated_at: "2098-01-01T00:00:00Z",
      description: "A complete project description.",
      link: "https://example.com/project",
      attachment: null,
    });

    render(
      <MemoryRouter initialEntries={["/events/42"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    fireEvent.click(await screen.findByRole("button", { name: /share your project/i }));
    fireEvent.change(screen.getByLabelText(/project or file link/i), { target: { value: "https://example.com/project" } });
    fireEvent.change(screen.getByLabelText(/tell us about it/i), { target: { value: "A complete project description." } });
    fireEvent.click(screen.getByRole("button", { name: /send my submission/i }));

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Taylor Reed" } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "taylor@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "thoughtful123" } });
    fireEvent.click(screen.getByRole("button", { name: /join skillconnect/i }));

    expect(await screen.findByRole("heading", { name: /share what you've made/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/project or file link/i)).toHaveValue("https://example.com/project");
    fireEvent.click(screen.getByRole("button", { name: /send my submission/i }));

    await waitFor(() => expect(platformService.submitWork).toHaveBeenCalledWith({
      opportunity_id: 42,
      link: "https://example.com/project",
      attachment: null,
      description: "A complete project description.",
    }));
    expect(await screen.findByText(/your work is in/i)).toBeInTheDocument();
  });

  it("stores an account only after successful signup", async () => {
    platformService.signUp.mockResolvedValueOnce({
      access_token: "account-token",
      account: { id: 8, name: "Taylor Reed", email: "taylor@example.com", role: "student" },
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /join free/i }));
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Taylor Reed" } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "taylor@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "thoughtful123" } });
    fireEvent.click(screen.getByRole("button", { name: /join skillconnect/i }));

    expect(await screen.findByRole("button", { name: /open dashboard/i })).toBeInTheDocument();
    expect(localStorage.getItem("sc-token")).toBe("account-token");
    expect(platformService.signUp).toHaveBeenCalledWith({
      name: "Taylor Reed",
      email: "taylor@example.com",
      password: "thoughtful123",
      role: "student",
    });
  });

  it("signs out and clears the local session", async () => {
    localStorage.setItem("sc-token", "account-token");
    localStorage.setItem("sc-user", JSON.stringify({ id: 8, name: "Taylor Reed", email: "taylor@example.com", role: "student" }));

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    fireEvent.click((await screen.findAllByRole("button", { name: /sign out/i }))[0]);

    expect(localStorage.getItem("sc-token")).toBeNull();
    expect(localStorage.getItem("sc-user")).toBeNull();
    expect(await screen.findByRole("button", { name: /join free/i })).toBeInTheDocument();
    expect(screen.getByText(/you have been signed out/i)).toBeInTheDocument();
  });

  it("provides an actionable sign-in prompt in chat for visitors", async () => {
    render(
      <MemoryRouter initialEntries={["/messages"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /sign in to chat/i }));

    expect(await screen.findByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it("loads a conversation and persists sent messages through the API", async () => {
    localStorage.setItem("sc-token", "account-token");
    localStorage.setItem("sc-user", JSON.stringify({ id: 5, name: "Taylor Reed", email: "taylor@example.com", role: "student" }));
    platformService.listMembers.mockResolvedValueOnce([{ id: 7, name: "Avery Chen", role: "student" }]);
    platformService.listMessages.mockResolvedValueOnce([{
      id: 1,
      sender_id: 7,
      recipient_id: 5,
      body: "Are you joining the event?",
      sent_at: "2098-01-01T10:00:00Z",
      read_at: null,
    }]);
    platformService.sendMessage.mockResolvedValueOnce({
      id: 2,
      sender_id: 5,
      recipient_id: 7,
      body: "Yes, I am.",
      sent_at: "2098-01-01T10:01:00Z",
      read_at: null,
    });

    render(
      <MemoryRouter initialEntries={["/messages"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(await screen.findByText("Are you joining the event?")).toBeInTheDocument();
    expect(screen.getByText(/updates every 8 seconds/i)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: /write a message/i }), { target: { value: "Yes, I am." } });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => expect(platformService.sendMessage).toHaveBeenCalledWith({ recipient_id: 7, body: "Yes, I am." }));
    expect(await screen.findByText("Yes, I am.")).toBeInTheDocument();
  });

  it("opens lesson content and records lesson completion", async () => {
    localStorage.setItem("sc-token", "account-token");
    localStorage.setItem("sc-user", JSON.stringify({ id: 5, name: "Taylor Reed", email: "taylor@example.com", role: "student" }));
    platformService.listOpportunities.mockResolvedValueOnce([publishedTraining()]);
    platformService.getCurriculum.mockResolvedValueOnce([{
      id: 3,
      title: "Foundations",
      position: 0,
      lessons: [{ id: 12, title: "Research basics", content: "Practice asking open questions.", position: 0 }],
    }]);
    platformService.getMyDashboard
      .mockResolvedValueOnce({
        activity: [{ id: 6, opportunity_id: 43, opportunity_title: "Published Training", opportunity_type: "training", kind: "enrollment", status: "enrolled", progress: 0, created_at: "2098-01-01T00:00:00Z", deadline: "2098-01-01" }],
        submissions: [],
        upcoming_deadlines: [],
        lesson_progress: [],
      })
      .mockResolvedValueOnce({
        activity: [{ id: 6, opportunity_id: 43, opportunity_title: "Published Training", opportunity_type: "training", kind: "enrollment", status: "completed", progress: 100, created_at: "2098-01-01T00:00:00Z", deadline: "2098-01-01" }],
        submissions: [],
        upcoming_deadlines: [],
        lesson_progress: [{ id: 4, lesson_id: 12, opportunity_id: 43, completed_at: "2098-01-01T00:00:00Z" }],
      });
    platformService.completeLesson.mockResolvedValueOnce({ id: 4, lesson_id: 12, opportunity_id: 43, completed_at: "2098-01-01T00:00:00Z" });

    render(
      <MemoryRouter initialEntries={["/training/43"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    fireEvent.click(await screen.findByRole("button", { name: /research basics/i }));
    expect(await screen.findByText("Practice asking open questions.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /mark complete/i }));

    await waitFor(() => expect(platformService.completeLesson).toHaveBeenCalledWith(12));
    expect(await screen.findByText("100%")).toBeInTheDocument();
  });

  it("allows an administrator to update a listing status through the API", async () => {
    const listing = { ...publishedEvent(), owner_id: 9, start_date: "2098-01-15", deadline: "2098-01-01" };
    localStorage.setItem("sc-token", "admin-token");
    localStorage.setItem("sc-user", JSON.stringify({ id: 9, name: "Admin User", email: "admin@example.com", role: "admin" }));
    platformService.getCurrentAccount.mockResolvedValueOnce({ id: 9, name: "Admin User", email: "admin@example.com", role: "admin" });
    platformService.listOpportunities.mockResolvedValueOnce([listing]);
    platformService.listMyOpportunities.mockResolvedValueOnce([listing]);
    platformService.updateOpportunity.mockResolvedValueOnce({ ...listing, status: "closed" });

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    fireEvent.click(await screen.findByRole("button", { name: "Listings" }));
    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText(/listing status/i), { target: { value: "closed" } });
    fireEvent.click(screen.getByRole("button", { name: /save listing changes/i }));

    await waitFor(() => expect(platformService.updateOpportunity).toHaveBeenCalledWith(42, expect.objectContaining({ status: "closed" })));
    expect(await screen.findByText(/listing has been updated/i)).toBeInTheDocument();
  });
});
