/**
 * Strategy used in:
 * - A Study in Scarlet
 *
 * Books are split in several parts, where each part is split in chapters.
 * Each part and chapter titles are in h2, the content in p
 **/
import helper from '../utils/helper.js';
import _ from 'lodash';

const Strategy = {
  process(book) {
    this.book = book;
    this.$ = book.$;
    return Strategy.getElements()
      .then(Strategy.addMetadata)
      .then(Strategy.removeCruft)
      .then(Strategy.addPartsAndChapters)
      .then(Strategy.addReadableChapterName)
      // .then(Strategy.debug)
      ;
  },
  // Returns all the needed, unfiltered, elements
  getElements() {
    let $ = Strategy.$;
    let elements = $('h2,p');
    return Promise.resolve(_.map(elements, (element) => {
      let tagName = element.tagName;
      let content = helper.getNodeContent($(element));
      return {tagName, content};
    }));
  },
  // Add book and author names
  addMetadata(elements) {
    _.each(elements, (element) => {
      element.book = Strategy.book.book;
      element.author = Strategy.book.author;
    });
    return elements;
  },
  // Remove useless titles
  removeCruft(elements) {
    let maxIndex = elements.length - 1;
    elements = _.reject(elements, (element, index) => {
      let isTitle = element.tagName === 'H2';
      let content = element.content;
      if (!isTitle) {
        return false;
      }
      // This repeats the author
      if (content === `By ${element.author}`) {
        return true;
      }
      // Last element should not be a title
      if (index === maxIndex) {
        return true;
      }
      return false;
    });

    return elements;
  },
  // Add chapterName and partName to each element
  addPartsAndChapters(elements) {
    let partName = null;
    let chapterName = null;
    let chapterOrder = 0;
    let order = 0;
    function isPart(title) {
      return /^PART /.test(title);
    }
    return _.compact(_.map(elements, (element) => {
      let isTitle = element.tagName === 'H2';
      let content = element.content;
      order++;

      // Set the current part/chapter
      if (isTitle) {
        order = 0;
        if (isPart(content)) {
          partName = content;
        } else {
          chapterName = content;
          chapterOrder++;
        }
        return null;
      }

      return {...element, chapterOrder, chapterName, partName, order};
    }));
  },
  // Add a readable chapter name
  addReadableChapterName(elements) {
    elements = _.map(elements, (element) => {
      // Skip it if no chapter and name
      if (!element.partNam && !element.chapterName) {
        return null;
      }
      let partSplit = element.partName.split('.')[0];
      element.chapterName = `${partSplit}. ${element.chapterName}`;
      delete element.partName;
      return element;
    });

    return _.compact(elements);
  },
  debug(elements) {
    console.info(elements);
    return elements;
  }
};
export default Strategy;