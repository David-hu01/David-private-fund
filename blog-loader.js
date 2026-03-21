async function loadArticles() {
    try {
        const response = await fetch('blog-articles.json');
        const data = await response.json();
        const articles = data.articles || [];

        const blogList = document.getElementById('blogList');
        blogList.innerHTML = '';

        articles.forEach(article => {
            const isFeatured = article.category === 'featured';
            const isWeibo = (article.tags || []).includes("Weibo");
            const displayContent = isWeibo ? article.content : article.excerpt;

            const articleHTML = `
                <article class="blog-card ${isFeatured ? 'featured' : ''} rounded-xl p-${isFeatured ? '8' : '6'} shadow-${isFeatured ? 'lg' : 'md'}" 
                         onclick="${isWeibo ? '' : `showArticleDetail(${JSON.stringify(article).replace(/"/g, '&quot;')})`}"
                         style="cursor: ${isWeibo ? 'default' : 'pointer'}">
                    ${isWeibo ? '' : `
                    <h2 class="text-${isFeatured ? '3xl' : '2xl'} font-bold ${isFeatured ? '' : 'text-gray-900'} mb-${isFeatured ? '3' : '2'}">
                        ${article.title}
                    </h2>
                    `}
                    <p class="blog-date text-sm ${isFeatured ? '' : 'text-gray-500'} mb-${isFeatured ? '4' : '3'} font-mono">
                        ⏰ ${article.date} · ✍️ ${article.author}
                    </p>
                    <div class="blog-excerpt ${isFeatured ? 'text-base' : 'text-gray-700'} leading-relaxed mb-4 ${isWeibo ? 'text-lg font-medium' : ''}">
                        ${isWeibo ? parseMarkdown(displayContent) : displayContent}
                    </div>
                    <div class="flex items-center justify-between mt-4">
                        <div class="flex gap-2 items-center flex-wrap">
                            ${(article.tags || []).map(tag =>
                `<span class="text-xs ${isFeatured ? 'bg-white bg-opacity-20' : 'bg-gray-100 text-gray-700'} px-3 py-1 rounded-full">${tag}</span>`
            ).join('')}
                        </div>
                        ${isWeibo ? '' : `<span class="text-sm font-semibold ${isFeatured ? 'text-white' : 'text-blue-600'}">阅读全文 →</span>`}
                    </div>
                </article>
            `;

            blogList.insertAdjacentHTML('beforeend', articleHTML);
        });

        console.log(`✅ 已加载 ${articles.length} 篇文章`);
    } catch (error) {
        console.error('❌ 加载文章失败:', error);
        let errorMsg = '加载文章失败，请检查 blog-articles.json 文件';
        if (window.location.protocol === 'file:') {
            errorMsg = `
                <div class="bg-amber-50 border-l-4 border-amber-400 p-4 text-amber-800">
                    <p class="font-bold">⚠️ 浏览器安全限制</p>
                    <p class="mt-1">本地直接打开 HTML 无法加载数据。请在开发终端运行：</p>
                    <code class="block mt-2 bg-white p-2 border border-amber-200">python -m http.server 8000</code>
                    <p class="mt-2 text-sm italic">然后访问：<a href="http://localhost:8000/blog.html" class="underline">http://localhost:8000/blog.html</a></p>
                    <p class="mt-4 font-bold">或者直接使用 Python 发布：</p>
                    <code class="block mt-2 bg-white p-2 border border-amber-200">python manage_blog.py "在这里输入你的内容"</code>
                </div>
            `;
        }
        document.getElementById('blogList').innerHTML = `<div class="py-8">${errorMsg}</div>`;
    }
}

// 显示文章详情模态框
function showArticleDetail(article) {
    const modalHTML = `
        <div id="articleModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="if(event.target.id==='articleModal') this.remove()">
            <div class="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8" onclick="event.stopPropagation()">
                <div class="flex justify-between items-start mb-6">
                    <h1 class="text-3xl font-bold text-gray-900 flex-1 pr-4">${article.title}</h1>
                    <button onclick="document.getElementById('articleModal').remove()" class="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                </div>
                <div class="flex items-center gap-3 text-sm text-gray-500 mb-6 font-mono border-b pb-4">
                    <span>⏰ ${article.date}</span>
                    <span>·</span>
                    <span>✍️ ${article.author}</span>
                    <span>·</span>
                    <span>${article.tags.join(', ')}</span>
                </div>
                <!-- 分享按钮组 -->
                <div class="flex items-center gap-4 mb-6">
                    <span class="text-sm font-medium text-gray-600">分享至：</span>
                    <!-- Twitter -->
                    <button onclick="shareArticle('twitter', '${article.title.replace(/'/g, "\\'")}')" class="text-gray-400 hover:text-blue-400 transition-colors" title="分享到 Twitter">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                        </svg>
                    </button>
                    <!-- Telegram -->
                    <button onclick="shareArticle('telegram', '${article.title.replace(/'/g, "\\'")}')" class="text-gray-400 hover:text-blue-500 transition-colors" title="分享到 Telegram">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.2-1.58.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                        </svg>
                    </button>
                </div>
                <div class="prose max-w-none text-gray-700 leading-relaxed">
                    ${parseMarkdown(article.content)}
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 分享文章函数
function shareArticle(platform, title) {
    const url = window.location.href;
    if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'telegram') {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
    }
}

// 简单的 Markdown 解析
function parseMarkdown(text) {
    if (!text) return '';
    return text.split('\n').map(line => {
        if (line.startsWith('# ')) return '<h1 class="text-2xl font-bold mt-6 mb-3">' + line.substring(2) + '</h1>';
        if (line.startsWith('## ')) return '<h2 class="text-xl font-bold mt-5 mb-2">' + line.substring(3) + '</h2>';
        if (line.startsWith('### ')) return '<h3 class="text-lg font-bold mt-4 mb-2">' + line.substring(4) + '</h3>';
        if (line.trim() === '') return '<br/>';
        line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        line = line.replace(/\*(.+?)\*/g, '<em>$1</em>');
        line = line.replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>');
        return '<p class="mb-3">' + line + '</p>';
    }).join('');
}

// 页面加载时执行
window.addEventListener('load', loadArticles);

// 搜索功能
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            document.querySelectorAll('.blog-card').forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(term) ? 'block' : 'none';
            });
        });
    }
});
