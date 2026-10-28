
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api/movies";

const INITIAL_FORM = {
  title: "",
  genre: "Action",
  releaseYear: new Date().getFullYear(),
  runtime: 120,
  platform: "Netflix",
  priority: 3,
};

function App() {
  const [movies, setMovies] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [genre, setGenre] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...INITIAL_FORM });

  const genres = [
    "Action",
    "Comedy",
    "Drama",
    "Horror",
    "Sci-Fi",
    "Romance",
    "Thriller",
  ];

  const platforms = [
    "Netflix",
    "Prime Video",
    "Hotstar",
    "Theatre",
    "Other",
  ];

  async function request(url, options = {}) {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Request failed");
    }

    return result;
  }

  async function loadMovies() {
    try {
      const params = new URLSearchParams();

      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      if (genre) params.set("genre", genre);

      const result = await request(`${API}?${params}`);
      setMovies(result.data?.movies ?? result.data ?? []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function loadStats() {
    try {
      const result = await request(`${API}/stats`);
      setStats(result.data);
    } catch (error) {
      console.error("Could not load statistics:", error.message);
    }
  }

  useEffect(() => {
    loadMovies();
    loadStats();
  }, [search, status, genre]);

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetForm() {
    setEditing(null);
    setForm({ ...INITIAL_FORM });
  }

  async function saveMovie(event) {
    event.preventDefault();
    setMessage("");

    try {
      const payload = {
        ...form,
        releaseYear: Number(form.releaseYear),
        runtime: Number(form.runtime),
        priority: Number(form.priority),
      };

      if (editing) {
        const { releaseYear, ...editPayload } = payload;

        await request(`${API}/${editing}`, {
          method: "PUT",
          body: JSON.stringify(editPayload),
        });

        setMessage("Movie updated successfully!");
      } else {
        const result = await request(API, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setMessage(
          result.data?.posterUrl
            ? "Movie added successfully with poster!"
            : "Movie added, but no poster was found. Please try again later."
        );
      }

      resetForm();
      await loadMovies();
      await loadStats();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function editMovie(movie) {
    setEditing(movie._id);

    setForm({
      title: movie.title,
      genre: movie.genre,
      releaseYear: movie.releaseYear,
      runtime: movie.runtime,
      platform: movie.platform,
      priority: movie.priority,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function changeStatus(movie) {
    let nextStatus;
    let rating;

    if (movie.status === "To Watch") {
      nextStatus = "Watching";
    } else if (movie.status === "Watching") {
      const watched = window.confirm(
        "Mark this movie as Watched? Press Cancel to move it back to To Watch."
      );

      if (watched) {
        nextStatus = "Watched";

        const answer = window.prompt("Enter a rating from 1 to 10:");

        if (answer === null) return;

        rating = Number(answer);

        if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
          setMessage("Please enter a whole-number rating from 1 to 10.");
          return;
        }
      } else {
        nextStatus = "To Watch";
      }
    } else {
      setMessage("Watched movies cannot change status.");
      return;
    }

    try {
      await request(`${API}/${movie._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus, rating }),
      });

      setMessage(`Movie status changed to ${nextStatus}.`);

      await loadMovies();
      await loadStats();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteMovie(movie) {
    const confirmed = window.confirm(`Delete "${movie.title}"?`);

    if (!confirmed) return;

    try {
      await request(`${API}/${movie._id}`, {
        method: "DELETE",
      });

      setMessage("Movie deleted successfully.");

      if (editing === movie._id) {
        resetForm();
      }

      await loadMovies();
      await loadStats();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function watchNext() {
    try {
      const result = await request(`${API}/watch-next`);
      const movie = result.data;

      if (!movie) {
        setMessage("No movies left in your To Watch list.");
        return;
      }

      setMessage(
        `Watch next: ${movie.title} (${movie.runtime} minutes)`
      );
    } catch (error) {
      setMessage(error.message);
    }
  }

  const statusCounts = stats?.statusCounts ?? {};

  const totalMovies =
    stats?.total ??
    stats?.totalMovies ??
    (
      (statusCounts["To Watch"] ?? 0) +
      (statusCounts.Watching ?? 0) +
      (statusCounts.Watched ?? 0)
    );

  const toWatchCount = statusCounts["To Watch"] ?? 0;

  return (
    <main className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">YOUR PERSONAL CINEMA</p>

          <h1>
            Movie<span>Mate</span>
          </h1>

          <p className="subtitle">
            Keep track of what you love, what you're watching,
            and what comes next.
          </p>
        </div>

        <button className="next-button" onClick={watchNext}>
          ▶ Pick My Next Movie
        </button>
      </header>

      {stats && (
        <section className="stats">
          <article className="stat-card">
            <span>Total Movies</span>
            <strong>{totalMovies}</strong>
          </article>

          <article className="stat-card">
            <span>To Watch</span>
            <strong>{toWatchCount}</strong>
          </article>

          <article className="stat-card">
            <span>Hours Watched</span>
            <strong>{stats.totalHoursWatched ?? 0}</strong>
          </article>

          <article className="stat-card">
            <span>Average Rating</span>
            <strong>{stats.averageRating ?? "—"} / 10</strong>
          </article>
        </section>
      )}

      {message && (
        <div className="message" role="status">
          {message}

          <button
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      <section className="content-grid">
        <section className="panel form-panel">
          <h2>{editing ? "Edit Movie" : "＋ Add a Movie"}</h2>

          <p className="muted">Build your personal watchlist.</p>

          <form onSubmit={saveMovie}>
            <label>
              Movie title

              <input
                name="title"
                value={form.title}
                onChange={updateForm}
                placeholder="e.g. Interstellar"
                required
              />
            </label>

            <div className="two-fields">
              <label>
                Genre

                <select
                  name="genre"
                  value={form.genre}
                  onChange={updateForm}
                >
                  {genres.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Release year

                <input
                  name="releaseYear"
                  type="number"
                  min="1950"
                  max={new Date().getFullYear()}
                  value={form.releaseYear}
                  onChange={updateForm}
                  required
                />
              </label>
            </div>

            <div className="two-fields">
              <label>
                Runtime (minutes)

                <input
                  name="runtime"
                  type="number"
                  min="30"
                  max="300"
                  value={form.runtime}
                  onChange={updateForm}
                  required
                />
              </label>

              <label>
                Platform

                <select
                  name="platform"
                  value={form.platform}
                  onChange={updateForm}
                >
                  {platforms.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Priority: {form.priority} / 5

              <input
                name="priority"
                type="range"
                min="1"
                max="5"
                value={form.priority}
                onChange={updateForm}
              />
            </label>

            <button className="primary-button" type="submit">
              {editing ? "Save Changes" : "Add to Watchlist"}
            </button>

            {editing && (
              <button
                className="secondary-button"
                type="button"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </section>

        <section className="panel list-panel">
          <div className="list-heading">
            <div>
              <h2>My Watchlist</h2>

              <p className="muted">
                Your next great movie is waiting.
              </p>
            </div>

            <span className="count">{movies.length} shown</span>
          </div>

          <input
            className="search-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="⌕ Search movie titles..."
          />

          <div className="filters">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="To Watch">To Watch</option>
              <option value="Watching">Watching</option>
              <option value="Watched">Watched</option>
            </select>

            <select
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
              aria-label="Filter by genre"
            >
              <option value="">All genres</option>

              {genres.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="movie-list">
            {movies.length === 0 ? (
              <div className="empty">
                <span>🎬</span>
                <h3>No movies found</h3>
                <p>Add your first movie or change your filters.</p>
              </div>
            ) : (
              movies.map((movie) => (
                <article className="movie-card" key={movie._id}>
                  <div className="movie-poster">
                    {movie.posterUrl ? (
                      <img
                        src={movie.posterUrl}
                        alt={`${movie.title} poster`}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="poster-placeholder">🎞️</span>
                    )}
                  </div>

                  <div className="movie-info">
                    <div className="movie-title-row">
                      <h3>{movie.title}</h3>

                      <span
                        className={`status ${movie.status
                          .replace(" ", "-")
                          .toLowerCase()}`}
                      >
                        {movie.status}
                      </span>
                    </div>

                    <p>
                      {movie.releaseYear} · {movie.genre} ·{" "}
                      {movie.runtime} min
                    </p>

                    <p className="movie-meta">
                      {movie.platform} · Priority {movie.priority}/5
                      {movie.rating ? ` · ⭐ ${movie.rating}/10` : ""}
                    </p>

                    <p className="movie-code">{movie.movieCode}</p>

                    <div className="movie-actions">
                      {movie.status !== "Watched" && (
                        <button onClick={() => changeStatus(movie)}>
                          {movie.status === "To Watch"
                            ? "▶ Start Watching"
                            : "✓ Mark Watched"}
                        </button>
                      )}

                      {movie.status === "Watched" && (
                        <span className="completed">✓ Completed</span>
                      )}

                      <button onClick={() => editMovie(movie)}>
                        Edit
                      </button>

                      {movie.status !== "Watching" && (
                        <button
                          className="delete-button"
                          onClick={() => deleteMovie(movie)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>

      <footer>
        MovieMate · Your stories, your watchlist.
        <p className="tmdb-credit">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </footer>
    </main>
  );
}

export default App;
