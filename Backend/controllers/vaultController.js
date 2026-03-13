const VaultItem = require('../models/VaultItem');

/* ── helper: calculate password strength ── */
function calcStrength(password) {
  if (!password) return 1;
  let score = 0;
  if (password.length >= 8)            score++;
  if (password.length >= 12)           score++;
  if (/[A-Z]/.test(password))          score++;
  if (/[0-9]/.test(password))          score++;
  if (/[^A-Za-z0-9]/.test(password))   score++;
  if (score <= 1) return 1;
  if (score === 2) return 2;
  if (score === 3) return 3;
  return 4;
}

/* ══════════════════════════════════════
   GET ALL
   GET /api/vault
══════════════════════════════════════ */
exports.getAll = async (req, res) => {
  try {
    const { search, category, sort = 'createdAt', order = 'desc' } = req.query;

    const filter = { user: req.user._id };

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name:     { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email:    { $regex: search, $options: 'i' } },
        { url:      { $regex: search, $options: 'i' } },
        { tags:     { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const items = await VaultItem.find(filter).sort({ [sort]: sortOrder });

    // Decrypt passwords before sending
    const safe = items.map(item => item.toSafeObject());

    res.json({ items: safe, total: safe.length });
  } catch (err) {
    console.error('GetAll error:', err.message);
    res.status(500).json({ error: 'Could not fetch vault items.' });
  }
};

/* ══════════════════════════════════════
   GET STATS
   GET /api/vault/stats
══════════════════════════════════════ */
exports.getStats = async (req, res) => {
  try {
    const items = await VaultItem.find({ user: req.user._id });

    const total     = items.length;
    const strong    = items.filter(i => i.strength === 4).length;
    const weak      = items.filter(i => i.strength <= 2).length;
    const favorites = items.filter(i => i.favorite).length;

    // Score out of 100
    const score = total === 0 ? 0 : Math.round((strong / total) * 100);

    // Count by category
    const byCategory = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    res.json({ total, strong, weak, favorites, score, byCategory });
  } catch (err) {
    console.error('GetStats error:', err.message);
    res.status(500).json({ error: 'Could not fetch stats.' });
  }
};

/* ══════════════════════════════════════
   GET FAVORITES
   GET /api/vault/favorites
══════════════════════════════════════ */
exports.getFavorites = async (req, res) => {
  try {
    const items = await VaultItem.find({
      user:     req.user._id,
      favorite: true,
    }).sort({ updatedAt: -1 });

    res.json({ items: items.map(i => i.toSafeObject()) });
  } catch (err) {
    console.error('GetFavorites error:', err.message);
    res.status(500).json({ error: 'Could not fetch favorites.' });
  }
};

/* ══════════════════════════════════════
   GET ONE
   GET /api/vault/:id
══════════════════════════════════════ */
exports.getOne = async (req, res) => {
  try {
    const item = await VaultItem.findOne({
      _id:  req.params.id,
      user: req.user._id,
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    res.json({ item: item.toSafeObject() });
  } catch (err) {
    console.error('GetOne error:', err.message);
    res.status(500).json({ error: 'Could not fetch item.' });
  }
};

/* ══════════════════════════════════════
   CREATE
   POST /api/vault
══════════════════════════════════════ */
exports.create = async (req, res) => {
  try {
    const { name, url, username, email, password, category, tags, notes } = req.body;
    
    console.log('Create vault item request:', { name, url, username, email, password: '***', category, tags, notes });

    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password are required.' });
    }

    const item = await VaultItem.create({
      user: req.user._id,
      name,
      url:      url      || '',
      username: username || '',
      email:    email    || '',
      password,           // encrypted automatically by pre-save hook
      category: category || 'Personal',
      tags:     tags     || [],
      notes:    notes    || '',
      strength: calcStrength(password),
    });

    console.log('Vault item created successfully:', item._id);

    res.status(201).json({
      message: 'Password saved.',
      item:    item.toSafeObject(),
    });
  } catch (err) {
    console.error('Create error:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ error: 'Could not save password.' });
  }
};

/* ══════════════════════════════════════
   UPDATE
   PUT /api/vault/:id
══════════════════════════════════════ */
exports.update = async (req, res) => {
  try {
    const { name, url, username, email, password, category, tags, notes } = req.body;

    const item = await VaultItem.findOne({
      _id:  req.params.id,
      user: req.user._id,
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    // Update only provided fields
    if (name     !== undefined) item.name     = name;
    if (url      !== undefined) item.url      = url;
    if (username !== undefined) item.username = username;
    if (email    !== undefined) item.email    = email;
    if (category !== undefined) item.category = category;
    if (tags     !== undefined) item.tags     = tags;
    if (notes    !== undefined) item.notes    = notes;

    if (password !== undefined) {
      item.password = password; // pre-save hook will encrypt it
      item.strength = calcStrength(password);
    }

    await item.save();

    res.json({
      message: 'Password updated.',
      item:    item.toSafeObject(),
    });
  } catch (err) {
    console.error('Update error:', err.message);
    res.status(500).json({ error: 'Could not update password.' });
  }
};

/* ══════════════════════════════════════
   TOGGLE FAVORITE
   PATCH /api/vault/:id/favorite
══════════════════════════════════════ */
exports.toggleFavorite = async (req, res) => {
  try {
    const item = await VaultItem.findOne({
      _id:  req.params.id,
      user: req.user._id,
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    item.favorite = !item.favorite;
    await item.save();

    res.json({
      message:  item.favorite ? 'Added to favorites.' : 'Removed from favorites.',
      favorite: item.favorite,
    });
  } catch (err) {
    console.error('ToggleFavorite error:', err.message);
    res.status(500).json({ error: 'Could not update favorite.' });
  }
};

/* ══════════════════════════════════════
   DELETE ONE
   DELETE /api/vault/:id
══════════════════════════════════════ */
exports.deleteOne = async (req, res) => {
  try {
    const item = await VaultItem.findOneAndDelete({
      _id:  req.params.id,
      user: req.user._id,
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    res.json({ message: 'Password deleted.' });
  } catch (err) {
    console.error('DeleteOne error:', err.message);
    res.status(500).json({ error: 'Could not delete password.' });
  }
};

/* ══════════════════════════════════════
   DELETE ALL
   DELETE /api/vault
══════════════════════════════════════ */
exports.deleteAll = async (req, res) => {
  try {
    await VaultItem.deleteMany({ user: req.user._id });
    res.json({ message: 'All passwords deleted.' });
  } catch (err) {
    console.error('DeleteAll error:', err.message);
    res.status(500).json({ error: 'Could not delete vault.' });
  }
};