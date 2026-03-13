const mongoose          = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const vaultItemSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true, // faster queries per user
    },

    name: {
      type:      String,
      required:  [true, 'Site name is required'],
      trim:      true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    url: {
      type:    String,
      trim:    true,
      default: '',
    },

    username: {
      type:    String,
      trim:    true,
      default: '',
    },

    email: {
      type:    String,
      trim:    true,
      default: '',
    },

    // Password is stored encrypted — never plain text
    password: {
      type:     String,
      required: [true, 'Password is required'],
    },

    category: {
      type:    String,
      enum:    ['Work', 'Personal', 'Finance', 'Development', 'Shopping', 'Social', 'Other'],
      default: 'Personal',
    },

    tags: {
      type:    [String],
      default: [],
    },

    notes: {
      type:    String,
      default: '',
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },

    favorite: {
      type:    Boolean,
      default: false,
    },

    // Password strength score 1–4
    strength: {
      type:    Number,
      min:     1,
      max:     4,
      default: 1,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

/* ══════════════════════════════════════
   AUTO ENCRYPT PASSWORD BEFORE SAVE
══════════════════════════════════════ */
vaultItemSchema.pre('save', function (next) {
  // Only encrypt if password field was changed
  if (!this.isModified('password')) return next();

  try {
    this.password = encrypt(this.password);
    next();
  } catch (err) {
    next(err);
  }
});

/* ══════════════════════════════════════
   AUTO ENCRYPT ON UPDATE (findOneAndUpdate)
══════════════════════════════════════ */
vaultItemSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update && update.password) {
    try {
      update.password = encrypt(update.password);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

/* ══════════════════════════════════════
   INSTANCE METHOD — GET DECRYPTED PASSWORD
══════════════════════════════════════ */
vaultItemSchema.methods.getDecryptedPassword = function () {
  try {
    return decrypt(this.password);
  } catch {
    return '';
  }
};

/* ══════════════════════════════════════
   VIRTUAL — safe JSON output
   (replaces encrypted password with decrypted)
══════════════════════════════════════ */
vaultItemSchema.methods.toSafeObject = function () {
  const obj      = this.toObject();
  obj.password   = this.getDecryptedPassword();
  obj.id         = obj._id;
  return obj;
};

const VaultItem = mongoose.model('VaultItem', vaultItemSchema);
module.exports = VaultItem;