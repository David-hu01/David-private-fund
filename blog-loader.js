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
                    <div class="flex items-center justify-between">
                        <div class="flex gap-2">
                            ${(article.tags || []).map(tag =>
                `<span class="text-xs ${isFeatured ? 'bg-white bg-opacity-20' : 'bg-gray-100 text-gray-700'} px-3 py-1 rounded-full">${tag}</span>`
            ).join('')}
                        </div>
                        ${isWeibo ? '' : `<span class="text-sm font-semibold ${isFeatured ? '' : 'text-blue-600'}">阅读全文 →</span>`}
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
                <div class="flex items-center gap-3 text-sm text-gray-500 mb-6 font-mono">
                    <span>⏰ ${article.date}</span>
                    <span>·</span>
                    <span>✍️ ${article.author}</span>
                    <span>·</span>
                    <span>${article.tags.join(', ')}</span>
                </div>
                <div class="prose max-w-none text-gray-700 leading-relaxed">
                    ${parseMarkdown(article.content)}
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
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
