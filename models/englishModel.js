const mongoose = require('mongoose');
const { EditorState, ContentState } = require('draft-js');
const { stateFromHTML } = require('draft-js-import-html');
const draftToHtml = require('draftjs-to-html');

const englishArticleSchema = new mongoose.Schema({
  headline: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  photos: {
    type: [String],
    default: [],
  },
  youtubeLink: {
    type: String,
  },
  category: {
    type: String,
    required: true,
    enum: ['politics', 'sports', 'economics', 'lifestyle', 'tourism', 'international', 'science', 'society','mountaineering','photogallery'],
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
    type: String,
    default: 'Unknown',
  },
}, { timestamps: true });

englishArticleSchema.virtual('richTextContent')
  .get(function () {
    const contentState = stateFromHTML(this.content);
    return EditorState.createWithContent(contentState);
  })
  .set(function (editorState) {
    this.content = draftToHtml(editorState.getCurrentContent());
  });

englishArticleSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

const EnglishArticle = mongoose.model('EnglishArticle', englishArticleSchema);

module.exports = EnglishArticle;