import { Router } from "express";
import mongoose from "mongoose";
import Event from "../models/Event.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
const categories = ["Workshop", "Seminar", "Cultural", "Sports", "Technical", "Other"];
const validId = id => mongoose.isValidObjectId(id);
const shapeEvent = (event, userId) => {
  const item = event.toObject ? event.toObject() : event;
  const registrations = item.registrations || [];
  return {
    ...item,
    registrationCount: registrations.length,
    isRegistered: userId ? registrations.some(id => String(id?._id || id) === String(userId)) : false,
    registrations: undefined
  };
};
function validateEvent(body) {
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const category = String(body.category || "");
  const venue = String(body.venue || "").trim();
  const date = new Date(body.date);
  const capacity = Number(body.capacity);
  if (title.length < 3) return "Title must contain at least 3 characters.";
  if (description.length < 10) return "Description must contain at least 10 characters.";
  if (!categories.includes(category)) return "Choose a valid category.";
  if (venue.length < 2) return "Venue is required.";
  if (!body.date || Number.isNaN(date.getTime())) return "Choose a valid event date and time.";
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 50000) return "Capacity must be a whole number from 1 to 50000.";
  return null;
}

router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category && categories.includes(req.query.category)) filter.category = req.query.category;
    if (req.query.q) {
      const q = String(req.query.q).slice(0, 100);
      filter.$or = [{ title: { $regex: q, $options: "i" } }, { description: { $regex: q, $options: "i" } }, { venue: { $regex: q, $options: "i" } }];
    }
    const events = await Event.find(filter).populate("createdBy", "name").sort({ date: 1 }).limit(200);
    res.json({ events: events.map(event => shapeEvent(event, req.user?._id)) });
  } catch (error) { next(error); }
});

router.get("/mine/registrations", requireAuth, async (req, res, next) => {
  try {
    const events = await Event.find({ registrations: req.user._id }).populate("createdBy", "name").sort({ date: 1 });
    res.json({ events: events.map(event => shapeEvent(event, req.user._id)) });
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid event ID." });
    const event = await Event.findById(req.params.id).populate("createdBy", "name");
    if (!event) return res.status(404).json({ message: "Event not found." });
    res.json({ event: shapeEvent(event, req.user?._id) });
  } catch (error) { next(error); }
});

router.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const issue = validateEvent(req.body);
    if (issue) return res.status(400).json({ message: issue });
    const event = await Event.create({
      title: req.body.title.trim(), description: req.body.description.trim(), category: req.body.category,
      venue: req.body.venue.trim(), date: new Date(req.body.date), capacity: Number(req.body.capacity), createdBy: req.user._id
    });
    res.status(201).json({ event: shapeEvent(event, req.user._id) });
  } catch (error) { next(error); }
});

router.put("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid event ID." });
    const issue = validateEvent(req.body);
    if (issue) return res.status(400).json({ message: issue });
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found." });
    if (Number(req.body.capacity) < event.registrations.length) return res.status(400).json({ message: "Capacity cannot be lower than the current registration count." });
    Object.assign(event, {
      title: req.body.title.trim(), description: req.body.description.trim(), category: req.body.category,
      venue: req.body.venue.trim(), date: new Date(req.body.date), capacity: Number(req.body.capacity)
    });
    await event.save();
    res.json({ event: shapeEvent(event, req.user._id) });
  } catch (error) { next(error); }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid event ID." });
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found." });
    res.json({ message: "Event deleted." });
  } catch (error) { next(error); }
});

router.post("/:id/register", requireAuth, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid event ID." });
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found." });
    if (event.date <= new Date()) return res.status(400).json({ message: "Registration is closed because this event has started or passed." });
    if (event.registrations.some(id => String(id) === String(req.user._id))) return res.status(409).json({ message: "You are already registered for this event." });
    if (event.registrations.length >= event.capacity) return res.status(409).json({ message: "This event is full." });
    event.registrations.push(req.user._id);
    await event.save();
    res.json({ event: shapeEvent(event, req.user._id), message: "You are registered for this event." });
  } catch (error) { next(error); }
});

router.delete("/:id/register", requireAuth, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid event ID." });
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found." });
    event.registrations = event.registrations.filter(id => String(id) !== String(req.user._id));
    await event.save();
    res.json({ event: shapeEvent(event, req.user._id), message: "Registration cancelled." });
  } catch (error) { next(error); }
});

export default router;
