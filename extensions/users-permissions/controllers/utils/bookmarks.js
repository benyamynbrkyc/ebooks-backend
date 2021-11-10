const processBookmarks = (newBookmark, userBookmarks) => {
  const { bookId } = newBookmark;

  const existingBookmarkIdx = userBookmarks.findIndex(
    (book) => book.bookId === bookId
  );

  if (existingBookmarkIdx !== -1) {
    userBookmarks[existingBookmarkIdx] = { ...newBookmark };
    return [...userBookmarks];
  }

  return [...userBookmarks, newBookmark];
};

module.exports = {
  processBookmarks,
};
