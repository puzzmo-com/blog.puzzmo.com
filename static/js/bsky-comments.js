// Bluesky Comments for Hugo
// Fetches and displays replies from a Bluesky post thread

(function () {
  const commentsDiv = document.getElementById("bsky-comments");
  if (!commentsDiv) return;

  const postUrl = commentsDiv.dataset.uri;
  if (!postUrl) return;

  const uri = toAtProtoUri(postUrl);
  if (!uri) return;

  fetchComments(uri);

  function toAtProtoUri(url) {
    const match = url.match(
      /https:\/\/bsky\.app\/profile\/([^/]+)\/post\/([^/]+)/
    );
    if (!match) return null;
    const [, handle, postId] = match;
    return `at://${handle}/app.bsky.feed.post/${postId}`;
  }

  function toBskyUrl(uri) {
    const match = uri.match(/at:\/\/([^/]+)\/app\.bsky\.feed\.post\/([^/]+)/);
    if (!match) return null;
    const [, handle, postId] = match;
    return `https://bsky.app/profile/${handle}/post/${postId}`;
  }

  async function fetchComments(uri) {
    const apiUrl = `https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(uri)}&depth=10`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const data = await response.json();
      renderThread(data.thread);
    } catch (error) {
      commentsDiv.innerHTML = `<p class="bsky-error">Could not load comments: ${error.message}</p>`;
    }
  }

  function renderThread(thread) {
    if (!thread.replies || thread.replies.length === 0) {
      commentsDiv.innerHTML =
        '<p class="bsky-no-comments">No comments yet. Be the first to reply on Bluesky!</p>';
      return;
    }

    // Sort replies by likes (most liked first)
    const sortedReplies = thread.replies.sort(
      (a, b) => (b.post?.likeCount || 0) - (a.post?.likeCount || 0)
    );

    const commentsHtml = sortedReplies.map((reply) => renderComment(reply, 0)).join("");
    commentsDiv.innerHTML = commentsHtml;
  }

  function renderComment(reply, depth) {
    if (!reply.post) return "";

    const post = reply.post;
    const author = post.author;
    const record = post.record;
    const postUrl = toBskyUrl(post.uri);
    const timestamp = new Date(record.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const avatarUrl = author.avatar || "";
    const displayName = author.displayName || author.handle;
    const handle = author.handle;
    const text = record.text || "";

    const nestedReplies = reply.replies
      ? reply.replies.map((r) => renderComment(r, depth + 1)).join("")
      : "";

    const marginLeft = depth > 0 ? "margin-left: 1.5rem;" : "";

    return `
      <div class="bsky-comment" style="${marginLeft}">
        <div class="bsky-comment-header">
          ${avatarUrl ? `<img class="bsky-avatar" src="${avatarUrl}" alt="${displayName}" />` : '<div class="bsky-avatar-placeholder"></div>'}
          <div class="bsky-author">
            <a href="https://bsky.app/profile/${handle}" target="_blank" rel="noopener" class="bsky-display-name">${escapeHtml(displayName)}</a>
            <span class="bsky-handle">@${handle}</span>
          </div>
          <a href="${postUrl}" target="_blank" rel="noopener" class="bsky-timestamp">${timestamp}</a>
        </div>
        <div class="bsky-comment-text">${escapeHtml(text)}</div>
        <div class="bsky-comment-stats">
          <span title="Replies">💬 ${post.replyCount || 0}</span>
          <span title="Reposts">🔁 ${post.repostCount || 0}</span>
          <span title="Likes">❤️ ${post.likeCount || 0}</span>
        </div>
        ${nestedReplies}
      </div>
    `;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
})();
