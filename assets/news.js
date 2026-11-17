/* お知らせ（microCMS から読む）2026-11-17 うぇぶこ
   キー＝読み取り専用（GET のみ）＝ページに埋めてよいもの。一覧：?orders=-date／詳細：news.html?id=<id>
   0件・失敗のときは「現在お知らせはありません。」（ページは崩さない）。日付は JST の YYYY.MM.DD */
(function () {
  var EP = 'https://nomura-leathercraft.microcms.io/api/v1/news', KEY = '6B7ZixpgeDLCQPmW1HRbHS8kS4e5OAnvy6Io';
  var EMPTY = '現在お知らせはありません。';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ymd(iso) {
    var d = new Date(iso); if (!iso || isNaN(d)) return '';
    var j = new Date(d.getTime() + 9 * 3600e3); function z(n) { return (n < 10 ? '0' : '') + n; }
    return j.getUTCFullYear() + '.' + z(j.getUTCMonth() + 1) + '.' + z(j.getUTCDate());
  }
  function get(path) { return fetch(EP + path, { headers: { 'X-MICROCMS-API-KEY': KEY } }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function empty(el, msg) { el.innerHTML = '<p class="cms-empty">' + esc(msg || EMPTY) + '</p>'; }
  function items(list) {
    return list.map(function (n) {
      return '<li><a href="news.html?id=' + encodeURIComponent(n.id) + '"><time datetime="' + esc(n.date) + '">' + ymd(n.date) + '</time><span class="t">' + esc(n.title) + '</span><span class="ar">›</span></a></li>';
    }).join('');
  }
  function list(el) {
    var limit = +el.dataset.limit || 10, off = 0, ul = null, more = null;
    function load() {
      if (more) more.querySelector('button').disabled = true;
      get('?orders=-date&limit=' + limit + '&offset=' + off + '&fields=id,title,date,image').then(function (d) {
        var c = d.contents || [];
        if (!ul) { if (!c.length) { empty(el); return; } el.innerHTML = '<ul class="nlist nlist--cms"></ul>'; ul = el.firstChild; }
        ul.insertAdjacentHTML('beforeend', items(c)); off += c.length;
        if (el.dataset.more && off < (d.totalCount || 0)) {
          if (!more) { more = document.createElement('div'); more.className = 'cms-more'; more.innerHTML = '<button type="button">もっと見る</button>'; el.appendChild(more); more.querySelector('button').addEventListener('click', load); }
          more.querySelector('button').disabled = false;
        } else if (more) { more.remove(); more = null; }
      }).catch(function () { if (!ul) empty(el); else if (more) more.querySelector('button').disabled = false; });
    }
    load();
  }
  function detail(el, id) {
    get('/' + encodeURIComponent(id)).then(function (n) {
      var im = n.image && n.image.url ? n.image : null;
      var img = im ? '<figure><img src="' + esc(im.url) + '?w=1200" alt=""' + (im.width ? ' width="' + im.width + '" height="' + im.height + '"' : '') + '></figure>' : '';
      el.innerHTML = '<article class="news-detail"><time datetime="' + esc(n.date) + '">' + ymd(n.date) + '</time><h2>' + esc(n.title) + '</h2>' + img +
        '<div class="news-body">' + (n.body || '') + '</div><p class="news-back"><a class="more" href="news.html">お知らせ一覧へ</a></p></article>';
      document.title = n.title + '｜お知らせ｜野村製作所';
    }).catch(function () {
      el.innerHTML = '<p class="cms-empty">お知らせが見つかりませんでした。</p><p class="news-back"><a class="more" href="news.html">お知らせ一覧へ</a></p>';
    });
  }
  document.querySelectorAll('.cms-news').forEach(function (el) {
    var id = el.dataset.detail && new URLSearchParams(location.search).get('id');
    if (id) detail(el, id); else list(el);
  });
})();
