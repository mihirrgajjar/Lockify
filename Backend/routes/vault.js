const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const {
  getAll,
  getStats,
  getFavorites,
  getOne,
  create,
  update,
  toggleFavorite,
  deleteOne,
  deleteAll,
} = require('../controllers/vaultController');

// All vault routes require JWT token
router.use(auth);

router.get   ('/',              getAll);
router.get   ('/stats',         getStats);
router.get   ('/favorites',     getFavorites);
router.get   ('/:id',           getOne);
router.post  ('/',              create);
router.put   ('/:id',           update);
router.patch ('/:id/favorite',  toggleFavorite);
router.delete('/',              deleteAll);
router.delete('/:id',           deleteOne);

module.exports = router;