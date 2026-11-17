import { Route, Routes } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout.jsx";
import Home from "../pages/Home.jsx";
import NotFound from "../pages/NotFound.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="explore" element={<Home />} />
        <Route path="events" element={<Home />} />
        <Route path="training" element={<Home />} />
        <Route path="jobs" element={<Home />} />
        <Route path="events/:id" element={<Home />} />
        <Route path="training/:id" element={<Home />} />
        <Route path="jobs/:id" element={<Home />} />
        <Route path="dashboard" element={<Home />} />
        <Route path="admin" element={<Home />} />
        <Route path="organizer" element={<Home />} />
        <Route path="messages" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
