const mongoose = require('mongoose');
const { EditorState } = require('draft-js');
const { stateFromHTML } = require('draft-js-import-html');
const draftToHtml = require('draftjs-to-html');

const articleSchema = new mongoose.Schema({
  headline: {
    type: String,
    required: true,
    trim: true,
  },
  subheadline: {
    type: String,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  selectedTags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag',
  }],
  selectedAuthors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author',
  }],
  photos: [{
    type: String,
  }],
  youtubeLink: {
    type: String,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  lastTrendingUpdate: {
    type: Date,
    default: Date.now,
  },
  shareCount: {
    type: Number,
    default: 0,
  },
  location: {
    type: {
      type: String, // 'Point'
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0], // Default location
    },
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published'],
    default: 'draft',
  },
  publishDate: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set to the current date
  },
  updatedAt: {
    type: Date,
    default: Date.now, // Automatically set to the current date
  }
}, { timestamps: true });

// Virtual to handle rich text content
articleSchema.virtual('richTextContent')
  .get(function () {
    if (this.content) {
      const contentState = stateFromHTML(this.content);
      return EditorState.createWithContent(contentState);
    }
    return EditorState.createEmpty();
  })
  .set(function (editorState) {
    this.content = draftToHtml(editorState.getCurrentContent());
  });

// Save hook to update `updatedAt` and set `publishDate` when an article is published
articleSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishDate) {
    this.publishDate = Date.now();
  }
  
  // Update the updatedAt timestamp whenever the document is modified
  this.updatedAt = Date.now();
  
  next();
});

// Method to increment the views count
articleSchema.methods.incrementViews = async function () {
  this.views += 1;
  await this.save();
  return this;
};

// Indexes to optimize search and sorting functionality
articleSchema.index({ headline: 1 });
articleSchema.index({ category: 1 });
articleSchema.index({ createdAt: -1 }); // Sort articles by created date (newest first)
articleSchema.index({ publishDate: -1 }); // Sort by publish date (newest first)
articleSchema.index({ updatedAt: -1 }); // Sort articles by updated date (newest first)

// Create the model
const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
