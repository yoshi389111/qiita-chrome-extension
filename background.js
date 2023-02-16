/** 過去日のラベルを作成 */
const createLabelPastArticles = (num) => {
    switch (num) {
        case 0: return '今日';
        case 1: return '昨日';
        default: return `${num}日前`;
    }
}

/** 指定された過去日を 'YYYY-MM-DD' 形式で返す */
const calcPastDate = (num) => {
    const day = new Date();
    day.setDate(day.getDate() - num);
    const year = day.getFullYear().toString().padStart(4, '0');
    const month = (day.getMonth() + 1).toString().padStart(2, '0');
    const date = day.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${date}`;
}

/** ユーザー名が取得できない場合のデフォルト値 */
const DEFAULT_USERNAME = 'qiita';

/** Qiita の URL からユーザー名を抽出 */
const extractUserName = (url) => {
    if (!url) {
        return DEFAULT_USERNAME;
    }
    const array = url.match(/https?:\/\/qiita\.com\/([^\/\?]+)/);
    if (!array) {
        return DEFAULT_USERNAME;
    }
    return array[1];
}

// メニューの登録
chrome.runtime.onInstalled.addListener(() => {
    // 新着一覧
    chrome.contextMenus.create({
        type: 'normal',
        id: 'newArticles',
        title: '新着一覧',
        documentUrlPatterns: [
            '*://qiita.com/*'
        ]
    });
    // 日付ごとのグルーピング用
    chrome.contextMenus.create({
        type: 'normal',
        id: 'dailyArticles',
        title: '日付別新着',
        documentUrlPatterns: [
            '*://qiita.com/*'
        ]
    });
    // 今日～7日前の新着一覧
    [...Array(8)].forEach((_, i) => {
        chrome.contextMenus.create({
            type: 'normal',
            id: `${i}DayAgoArticles`,
            title: `${createLabelPastArticles(i)}の新着一覧`,
            parentId: 'dailyArticles'
        });
    });
    chrome.contextMenus.create({
        type: 'separator',
        id: `separator`,
        title: `セパレータ`,
        parentId: 'dailyArticles'
    });
    chrome.contextMenus.create({
        type: 'normal',
        id: `randamAgoArticles`,
        title: `ランダム過去日の新着一覧`,
        parentId: 'dailyArticles'
    });
    // ユーザーの記事（いいね順）
    chrome.contextMenus.create({
        type: 'normal',
        id: 'userArticles',
        title: 'このユーザーの記事（いいね順）',
        contexts: [ 'page', 'link' ],
        documentUrlPatterns: [
            '*://qiita.com/*'
        ]
    });
    chrome.contextMenus.create({
        type: 'normal',
        id: 'discussions',
        title: 'ディスカッション',
        documentUrlPatterns: [
            '*://qiita.com/*'
        ]
    });
});

// メニュークリック時の処理
chrome.contextMenus.onClicked.addListener((item, tab) => {
    const url = new URL('https://qiita.com/search');
    if (item.menuItemId === 'newArticles') {
        url.searchParams.set('sort', 'created');
        url.searchParams.set('q', 'created:>1970-01-01');
    } else if (item.menuItemId.endsWith('DayAgoArticles')) {
        const num = parseInt(item.menuItemId);
        url.searchParams.set('sort', 'created');
        url.searchParams.set('q', 'created:' + calcPastDate(num));
    } else if (item.menuItemId === 'userArticles') {
        const user = extractUserName(item.linkUrl || item.pageUrl);
        url.searchParams.set('sort', 'like'); // いいね順
        url.searchParams.set('q', `user:${user}`);
    } else if (item.menuItemId.endsWith('randamAgoArticles')) {
        const diffSecond = new Date().getTime() - new Date(2011, 9-1, 16).getTime();
        const diffDay = Math.trunc(diffSecond / (1000 * 60 * 60 * 24));
        // Qiitaの始めの日から30日前までのどこかの日をランダムで決める
        const random = Math.trunc(Math.random() * (diffDay - 30)) + 30;
        url.searchParams.set('sort', 'created');
        url.searchParams.set('q', 'created:' + calcPastDate(random));
    } else if (item.menuItemId === 'discussions') {
        chrome.tabs.create({
            url: 'https://github.com/increments/qiita-discussions/discussions',
            index: tab.index + 1
        });
        return;
    } else {
        return;
    }
    chrome.tabs.create({ url: url.href, index: tab.index + 1 });
});
