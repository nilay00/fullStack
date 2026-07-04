const Interest = require("../models/Interest");

/**
 * Two users are "connections" once either side has sent an interest that the
 * other has accepted. This is the gate used throughout the app for anything
 * marked privacy = "connections" (avatar, gallery, messaging).
 */
async function areConnected(userIdA, userIdB) {
  if (String(userIdA) === String(userIdB)) return true;
  const interest = await Interest.findOne({
    status: "accepted",
    $or: [
      { from: userIdA, to: userIdB },
      { from: userIdB, to: userIdA },
    ],
  });
  return !!interest;
}

// Fetches every user id `viewerId` is connected to in ONE query — use this
// before looping over a list of profiles (browse, interest lists) instead of
// calling areConnected() once per profile.
async function getConnectedIds(viewerId) {
  if (!viewerId) return new Set();
  const interests = await Interest.find({
    status: "accepted",
    $or: [{ from: viewerId }, { to: viewerId }],
  });
  const ids = new Set();
  interests.forEach((i) => {
    const other = String(i.from) === String(viewerId) ? i.to : i.from;
    ids.add(String(other));
  });
  return ids;
}

function canViewSync(privacy, ownerId, viewerId, connectedIds) {
  if (!viewerId) return privacy === "public";
  if (String(ownerId) === String(viewerId)) return true;
  if (privacy === "public") return true;
  if (privacy === "private") return false;
  if (privacy === "connections") return connectedIds.has(String(ownerId));
  return true;
}

// Decide whether `viewerId` is allowed to see content gated by `privacy`
// ("public" | "connections" | "private") that belongs to `ownerId`.
// For a single lookup — for lists, fetch connectedIds once via
// getConnectedIds() and use applyPrivacySync/canViewSync instead.
async function canView(privacy, ownerId, viewerId) {
  if (!viewerId) return privacy === "public";
  if (String(ownerId) === String(viewerId)) return true;
  if (privacy === "public") return true;
  if (privacy === "private") return false;
  if (privacy === "connections") return areConnected(ownerId, viewerId);
  return true;
}

/**
 * Shapes a user document for a given viewer, applying avatar/gallery privacy.
 * When the viewer isn't allowed to see the photo, we still tell the client
 * a photo *exists* (so it can render a blurred placeholder + lock icon)
 * without ever sending the actual image URL.
 * `user` should already be a plain object (call .toObject() on a Mongoose doc first).
 */
function applyPrivacySync(user, viewerId, connectedIds) {
  if (!user) return user;
  const isSelf = String(user._id) === String(viewerId);
  const out = { ...user };

  const avatarVisible = isSelf || canViewSync(user.avatarPrivacy, user._id, viewerId, connectedIds);
  out.avatarVisible = avatarVisible;
  if (!avatarVisible) out.avatar = "";

  const galleryVisible = isSelf || canViewSync(user.galleryPrivacy, user._id, viewerId, connectedIds);
  out.galleryVisible = galleryVisible;
  out.galleryCount = Array.isArray(user.gallery) ? user.gallery.length : 0;
  if (!galleryVisible) out.gallery = [];

  return out;
}

// Convenience single-profile version (fetches connections itself).
async function applyPrivacy(user, viewerId) {
  if (!user) return user;
  const connectedIds = await getConnectedIds(viewerId);
  return applyPrivacySync(user, viewerId, connectedIds);
}

module.exports = { areConnected, canView, getConnectedIds, canViewSync, applyPrivacySync, applyPrivacy };
