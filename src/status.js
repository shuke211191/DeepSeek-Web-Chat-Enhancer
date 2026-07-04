import { S } from './state';
import { t } from './i18n';

var FEED_URL = 'https://status.deepseek.com/feed.atom';
var POLL_INTERVAL = 900000;

function parseAndStore(xhr) {
    try {
        var parser = new DOMParser();
        var xml = parser.parseFromString(xhr.responseText, 'text/xml');
        var entry = xml.querySelector('entry');
        if (!entry) return false;
        var title = entry.querySelector('title');
        var updated = entry.querySelector('updated');
        var summary = entry.querySelector('summary');
        var link = entry.querySelector('link[rel="alternate"]');
        S.statusData = {
            title: title ? title.textContent : '',
            updated: updated ? updated.textContent : '',
            summary: summary ? summary.textContent : '',
            link: link ? link.getAttribute('href') : ''
        };
        GM_setValue(S.K.STATUS_DATA, JSON.stringify(S.statusData));
        return true;
    } catch (e) {
        return false;
    }
}

function fetchStatusFeed() {
    GM_xmlhttpRequest({
        method: 'GET',
        url: FEED_URL,
        onload: function (xhr) { parseAndStore(xhr); },
        onerror: function () {}
    });
}

export function startStatusPoll() {
    S.statusPollOn = true;
    fetchStatusFeed();
    if (S.statusTimer) clearInterval(S.statusTimer);
    S.statusTimer = setInterval(fetchStatusFeed, POLL_INTERVAL);
}

export function stopStatusPoll() {
    S.statusPollOn = false;
    if (S.statusTimer) { clearInterval(S.statusTimer); S.statusTimer = null; }
}

export function refreshStatus(callback) {
    GM_xmlhttpRequest({
        method: 'GET',
        url: FEED_URL,
        onload: function (xhr) {
            var ok = parseAndStore(xhr);
            if (callback) callback(ok);
        },
        onerror: function () {
            if (callback) callback(false);
        }
    });
}

export function renderStatusEntry() {
    if (!S.statusData) return '';
    var d = S.statusData;
    var html = '<div class="dse-status-card">';
    if (d.link) {
        html += '<a class="dse-status-title" href="' + d.link + '" target="_blank" rel="noopener">' + d.title + '</a>';
    } else {
        html += '<div class="dse-status-title">' + d.title + '</div>';
    }
    try { html += '<div class="dse-status-time">' + new Date(d.updated).toLocaleString() + '</div>'; } catch (e) {}
    html += '<div class="dse-status-body">' + d.summary + '</div>';
    html += '</div>';
    return html;
}
