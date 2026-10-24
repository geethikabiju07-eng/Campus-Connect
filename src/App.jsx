
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Users,
  Search,
  Plus,
  X,
  LogIn,
  LogOut,
  TicketCheck,
  Sparkles,
  Pencil,
  Trash2,
  Clock3,
  GraduationCap,
  Menu,
} from "lucide-react";
import { api } from "./services/api";

const categories = [
  "All categories",
  "Workshop",
  "Seminar",
  "Cultural",
  "Sports",
  "Technical",
  "Other",
];

const blankEvent = {
  title: "",
  description: "",
  category: "Workshop",
  venue: "",
  date: "",
  capacity: "50",
};

const formatDate = (date) =>
  new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

const localDateTime = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("campusconnect_user"));
    } catch {
      return null;
    }
  });

  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [eventOpen, setEventOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [eventForm, setEventForm] = useState(blankEvent);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("events");
  const [mobileNav, setMobileNav] = useState(false);

  // Public event loading: no login is required to browse events.
  async function loadEvents() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (query.trim()) {
        params.set("q", query.trim());
      }

      if (category !== "All categories") {
        params.set("category", category);
      }

      const search = params.toString();
      const endpoint = search
        ? `/events?${search}`
        : "/events";

      const data = await api(endpoint);

      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (e) {
      setEvents([]);
      setError(
        e.message || "Unable to load events. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // Load events on first visit and whenever search or category changes.
  useEffect(() => {
    if (view === "events") {
      loadEvents();
    }
  }, [query, category, view]);

  function signOut() {
    localStorage.removeItem("campusconnect_token");
    localStorage.removeItem("campusconnect_user");

    setUser(null);
    setView("events");
    setNotice("You have logged out.");
    setError("");
  }

  async function submitAuth(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const data = await api(
        `/auth/${authMode === "login" ? "login" : "register"}`,
        {
          method: "POST",
          body: JSON.stringify(authForm),
        }
      );

      localStorage.setItem("campusconnect_token", data.token);
      localStorage.setItem(
        "campusconnect_user",
        JSON.stringify(data.user)
      );

      setUser(data.user);
      setAuthOpen(false);
      setAuthForm({ name: "", email: "", password: "" });
      setNotice(
        `Welcome${data.user.name ? `, ${data.user.name}` : ""}!`
      );

      if (view === "mine") {
        await loadMine();
      } else {
        await loadEvents();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function register(event) {
    if (!user) {
      setAuthMode("login");
      setAuthOpen(true);
      setNotice(
        "Log in or create an account to register for an event."
      );
      return;
    }

    setError("");
    setNotice("");

    try {
      const data = await api(`/events/${event._id}/register`, {
        method: "POST",
      });

      setNotice(data.message || "Registration successful.");
      await loadEvents();
    } catch (e) {
      setError(e.message);
    }
  }

  async function cancelRegistration(event) {
    if (!user) {
      setAuthMode("login");
      setAuthOpen(true);
      return;
    }

    setError("");
    setNotice("");

    try {
      const data = await api(`/events/${event._id}/register`, {
        method: "DELETE",
      });

      setNotice(data.message || "Registration cancelled.");

      if (view === "mine") {
        await loadMine();
      } else {
        await loadEvents();
      }
    } catch (e) {
      setError(e.message);
    }
  }

  async function loadMine() {
    if (!user) {
      setAuthMode("login");
      setAuthOpen(true);
      setNotice("Log in to view your registrations.");
      return;
    }

    setView("mine");
    setLoading(true);
    setError("");

    try {
      const data = await api("/events/mine/registrations");
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (e) {
      setEvents([]);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setEventForm(blankEvent);
    setEventOpen(true);
    setError("");
  }

  function openEdit(event) {
    setEditing(event._id);

    setEventForm({
      title: event.title,
      description: event.description,
      category: event.category,
      venue: event.venue,
      date: localDateTime(event.date),
      capacity: String(event.capacity),
    });

    setEventOpen(true);
    setError("");
  }

  async function saveEvent(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const path = editing
        ? `/events/${editing}`
        : "/events";

      const payload = {
        ...eventForm,
        capacity: Number(eventForm.capacity),
        date: new Date(eventForm.date).toISOString(),
      };

      const data = await api(path, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      setNotice(
        editing ? "Event updated." : "Event published."
      );
      setEventOpen(false);
      setEditing(null);
      setView("events");
      await loadEvents();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(event) {
    if (
      !window.confirm(
        `Delete "${event.title}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await api(`/events/${event._id}`, {
        method: "DELETE",
      });

      setNotice("Event deleted.");
      await loadEvents();
    } catch (e) {
      setError(e.message);
    }
  }

  const upcoming = useMemo(
    () =>
      events.filter(
        (event) => new Date(event.date) > new Date()
      ).length,
    [events]
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setView("events");
          }}
        >
          <span className="brand-mark">
            <GraduationCap size={25} />
          </span>
          <span>
            Campus<span className="brand-accent">Connect</span>
            <small>EVENTS THAT BRING US TOGETHER</small>
          </span>
        </a>

        <button
          className="mobile-menu"
          onClick={() => setMobileNav(!mobileNav)}
          aria-label="Toggle navigation"
        >
          <Menu />
        </button>

        <nav
          className={
            mobileNav ? "nav-links nav-open" : "nav-links"
          }
        >
          <button
            className={
              view === "events" ? "nav-link active" : "nav-link"
            }
            onClick={() => {
              setView("events");
              setMobileNav(false);
            }}
          >
            Discover events
          </button>

          {user && (
            <button
              className={
                view === "mine" ? "nav-link active" : "nav-link"
              }
              onClick={() => {
                loadMine();
                setMobileNav(false);
              }}
            >
              My registrations
            </button>
          )}

          {user?.role === "admin" && (
            <button
              className="nav-link"
              onClick={() => {
                openCreate();
                setMobileNav(false);
              }}
            >
              <Plus size={16} /> Manage events
            </button>
          )}
        </nav>

        <div className="account-area">
          {user ? (
            <>
              <span className="user-chip">
                <span className="avatar">
                  {user.name?.charAt(0)?.toUpperCase()}
                </span>
                <span className="user-name">
                  {user.name}
                  <small>
                    {user.role === "admin"
                      ? "Administrator"
                      : "Student"}
                  </small>
                </span>
              </span>

              <button
                className="icon-button"
                title="Log out"
                onClick={signOut}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button
              className="button button-dark button-small"
              onClick={() => {
                setAuthMode("login");
                setAuthOpen(true);
              }}
            >
              <LogIn size={16} /> Log in
            </button>
          )}
        </div>
      </header>

      <main>
        {view === "events" && (
          <section className="hero">
            <div className="hero-content">
              <div className="eyebrow">
                <Sparkles size={15} /> YOUR CAMPUS, YOUR COMMUNITY
              </div>

              <h1>
                Make memories.
                <br />
                <span>Find your people.</span>
              </h1>

              <p>
                Discover workshops, cultural fests, talks, and
                experiences happening around your campus.
              </p>

              <a
                className="button button-light"
                href="#event-list"
                onClick={() =>
                  document
                    .getElementById("event-list")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore events <span>↓</span>
              </a>
            </div>

            <div className="hero-art" aria-hidden="true">
              <div className="art-circle circle-one"></div>
              <div className="art-circle circle-two"></div>
              <div className="art-card">
                <CalendarDays size={31} />
                <strong>
                  Something
                  <br />
                  great is on.
                </strong>
                <span>See you there!</span>
              </div>
              <div className="art-spark spark-one">✳</div>
              <div className="art-spark spark-two">✦</div>
            </div>

            <div className="hero-bottom">
              <span>
                <CalendarDays size={16} /> Discover what’s next
              </span>
              <span>
                <Users size={16} /> Meet your community
              </span>
              <span>
                <TicketCheck size={16} /> Reserve your spot
              </span>
            </div>
          </section>
        )}

        <section className="content-section" id="event-list">
          <div className="section-heading">
            <div>
              <div className="eyebrow eyebrow-green">
                {view === "mine"
                  ? "YOUR EVENT PLANNER"
                  : "WHAT'S HAPPENING"}
              </div>

              <h2>
                {view === "mine"
                  ? "My registrations"
                  : "Upcoming campus events"}
              </h2>

              <p>
                {view === "mine"
                  ? "Your saved spots, all in one place."
                  : "Find something you’ll love. Your next favourite memory starts here."}
              </p>
            </div>

            {user?.role === "admin" && (
              <button
                className="button button-dark"
                onClick={openCreate}
              >
                <Plus size={17} /> Create event
              </button>
            )}
          </div>

          {view === "events" && (
            <div className="filters">
              <label className="search-box">
                <Search size={18} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search events, venues..."
                />
              </label>

              <select
                aria-label="Filter by category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {notice && (
            <div className="notice" role="status">
              {notice}
              <button
                onClick={() => setNotice("")}
                aria-label="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {error && (
            <div className="alert" role="alert">
              {error}
              <button
                onClick={() => {
                  setError("");
                  if (view === "events") loadEvents();
                  else loadMine();
                }}
                aria-label="Retry loading"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {loading ? (
            <div className="state-panel">
              <span className="spinner"></span>
              <p>Finding events for you…</p>
            </div>
          ) : events.length === 0 ? (
            <div className="state-panel empty">
              <div className="empty-icon">
                <CalendarDays size={28} />
              </div>

              <h3>
                {view === "mine"
                  ? "No registrations yet"
                  : "No events found just yet"}
              </h3>

              <p>
                {view === "mine"
                  ? "Browse campus events and reserve your first spot."
                  : "Try another search or check back soon for new events."}
              </p>

              {view === "mine" && (
                <button
                  className="button button-dark"
                  onClick={() => setView("events")}
                >
                  Explore events
                </button>
              )}
            </div>
          ) : (
            <div className="event-grid">
              {events.map((event) => {
                const full =
                  event.registrationCount >= event.capacity;
                const isPast =
                  new Date(event.date) <= new Date();

                return (
                  <article className="event-card" key={event._id}>
                    <div
                      className={`event-banner banner-${(
                        event.category || "other"
                      ).toLowerCase()}`}
                    >
                      <span className="category-pill">
                        {event.category}
                      </span>

                      <span className="banner-date">
                        <span>
                          {new Date(event.date)
                            .toLocaleDateString(undefined, {
                              month: "short",
                            })
                            .toUpperCase()}
                        </span>
                        <strong>
                          {new Date(event.date).getDate()}
                        </strong>
                      </span>

                      <div className="banner-decoration">✳</div>
                    </div>

                    <div className="event-card-body">
                      <h3>{event.title}</h3>
                      <p className="event-description">
                        {event.description}
                      </p>

                      <div className="event-meta">
                        <span>
                          <CalendarDays size={15} />
                          {formatDate(event.date)}
                        </span>
                        <span>
                          <MapPin size={15} />
                          {event.venue}
                        </span>
                        <span>
                          <Users size={15} />
                          {event.registrationCount || 0} /{" "}
                          {event.capacity} spots filled
                        </span>
                      </div>

                      <div className="capacity-track">
                        <span
                          style={{
                            width: `${
                              event.capacity > 0
                                ? Math.min(
                                    100,
                                    ((event.registrationCount || 0) /
                                      event.capacity) *
                                      100
                                  )
                                : 0
                            }%`,
                          }}
                        ></span>
                      </div>

                      <div className="event-card-footer">
                        {event.isRegistered ? (
                          <button
                            className="button button-outline"
                            onClick={() => cancelRegistration(event)}
                          >
                            Cancel registration
                          </button>
                        ) : (
                          <button
                            className="button button-dark"
                            disabled={full || isPast}
                            onClick={() => register(event)}
                          >
                            {isPast
                              ? "Event ended"
                              : full
                                ? "Fully booked"
                                : "Reserve my spot"}{" "}
                            <span>↗</span>
                          </button>
                        )}

                        {user?.role === "admin" && (
                          <div className="admin-actions">
                            <button
                              title="Edit event"
                              onClick={() => openEdit(event)}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              title="Delete event"
                              onClick={() => deleteEvent(event)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="bottom-note">
            <span className="note-icon">
              <Clock3 size={17} />
            </span>
            <span>
              <strong>Plans change. That's okay.</strong>
              <small>
                You can manage your event registrations from your
                account.
              </small>
            </span>
          </div>
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="#">
          <span className="brand-mark">
            <GraduationCap size={22} />
          </span>
          <span>
            Campus<span className="brand-accent">Connect</span>
            <small>EVENTS THAT BRING US TOGETHER</small>
          </span>
        </a>

        <span>
          Made for campus communities{" "}
          <span className="footer-heart">♥</span>
        </span>
        <span>CampusConnect · Student project</span>
      </footer>

      {authOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAuthOpen(false);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
          >
            <button
              className="modal-close"
              onClick={() => setAuthOpen(false)}
              aria-label="Close"
            >
              <X />
            </button>

            <div className="modal-symbol">
              <GraduationCap size={26} />
            </div>

            <div className="eyebrow eyebrow-green">
              WELCOME TO THE COMMUNITY
            </div>

            <h2 id="auth-title">
              {authMode === "login"
                ? "Welcome back"
                : "Create your account"}
            </h2>

            <p>
              {authMode === "login"
                ? "Log in to reserve your spot at the next campus event."
                : "Join your campus community and start exploring."}
            </p>

            <form onSubmit={submitAuth} className="form-stack">
              {authMode === "register" && (
                <label>
                  Full name
                  <input
                    required
                    minLength="2"
                    maxLength="80"
                    value={authForm.name}
                    onChange={(e) =>
                      setAuthForm({
                        ...authForm,
                        name: e.target.value,
                      })
                    }
                    placeholder="Your name"
                  />
                </label>
              )}

              <label>
                Email address
                <input
                  required
                  type="email"
                  value={authForm.email}
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      email: e.target.value,
                    })
                  }
                  placeholder="you@example.com"
                />
              </label>

              <label>
                Password
                <input
                  required
                  minLength="8"
                  type="password"
                  value={authForm.password}
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      password: e.target.value,
                    })
                  }
                  placeholder="At least 8 characters"
                />
              </label>

              <button
                className="button button-dark button-full"
                disabled={saving}
              >
                {saving
                  ? "Please wait…"
                  : authMode === "login"
                    ? "Log in"
                    : "Create account"}
              </button>
            </form>

            <div className="modal-switch">
              {authMode === "login"
                ? "New to CampusConnect?"
                : "Already have an account?"}{" "}
              <button
                onClick={() => {
                  setAuthMode(
                    authMode === "login" ? "register" : "login"
                  );
                  setError("");
                }}
              >
                {authMode === "login"
                  ? "Create account"
                  : "Log in"}
              </button>
            </div>

            {error && (
              <div className="alert modal-alert" role="alert">
                {error}
              </div>
            )}
          </section>
        </div>
      )}

      {eventOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEventOpen(false);
          }}
        >
          <section
            className="modal event-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-title"
          >
            <button
              className="modal-close"
              onClick={() => setEventOpen(false)}
              aria-label="Close"
            >
              <X />
            </button>

            <div className="eyebrow eyebrow-green">
              EVENT MANAGEMENT
            </div>

            <h2 id="event-title">
              {editing ? "Edit event" : "Create an event"}
            </h2>
            <p>Share something worth showing up for.</p>

            <form onSubmit={saveEvent} className="form-stack">
              <label>
                Event title
                <input
                  required
                  minLength="3"
                  maxLength="120"
                  value={eventForm.title}
                  onChange={(e) =>
                    setEventForm({
                      ...eventForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g. Design Thinking Workshop"
                />
              </label>

              <label>
                Description
                <textarea
                  required
                  minLength="10"
                  maxLength="3000"
                  rows="3"
                  value={eventForm.description}
                  onChange={(e) =>
                    setEventForm({
                      ...eventForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="What will attendees experience?"
                />
              </label>

              <div className="form-row">
                <label>
                  Category
                  <select
                    value={eventForm.category}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        category: e.target.value,
                      })
                    }
                  >
                    {categories.slice(1).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Capacity
                  <input
                    required
                    type="number"
                    min="1"
                    max="50000"
                    value={eventForm.capacity}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        capacity: e.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <label>
                Venue
                <input
                  required
                  minLength="2"
                  maxLength="160"
                  value={eventForm.venue}
                  onChange={(e) =>
                    setEventForm({
                      ...eventForm,
                      venue: e.target.value,
                    })
                  }
                  placeholder="e.g. Main Auditorium"
                />
              </label>

              <label>
                Date and time
                <input
                  required
                  type="datetime-local"
                  min={localDateTime(new Date())}
                  value={eventForm.date}
                  onChange={(e) =>
                    setEventForm({
                      ...eventForm,
                      date: e.target.value,
                    })
                  }
                />
              </label>

              {error && (
                <div className="alert" role="alert">
                  {error}
                </div>
              )}

              <button
                className="button button-dark button-full"
                disabled={saving}
              >
                {saving
                  ? "Saving…"
                  : editing
                    ? "Save changes"
                    : "Publish event"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
