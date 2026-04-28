// =============================================
// FLORAVIA STORE - JavaScript Principal
// =============================================

// URL do arquivo de produtos no GitHub Releases (RAW)
// O site busca APENAS o arquivo .txt, não outros arquivos do release
const PRODUTOS_URL = 'https://github.com/gamesistem/Floravia/releases/download/Loja/produtos.txt';

// Fallback caso o GitHub não responda (CORS)
// Use o raw do release asset via jsDelivr ou similar se necessário
const PRODUTOS_URL_FALLBACK = 'https://raw.githubusercontent.com/gamesistem/Floravia/refs/heads/Loja/produtos.txt';

// =============================================
// CARRINHO - LocalStorage
// =============================================

function getCarrinho() {
  return JSON.parse(localStorage.getItem('floravia_cart') || '[]');
}

function salvarCarrinho(carrinho) {
  localStorage.setItem('floravia_cart', JSON.stringify(carrinho));
}

function atualizarBadge() {
  const badge = document.getElementById('cartBadge');
  if (badge) {
    const count = getCarrinho().length;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  }
}

window.adicionarCarrinho = function(nomeProduto) {
  // Buscar produto da lista global (carregada)
  if (!window._produtosCarregados) return;
  const produto = window._produtosCarregados.find(p => p.nome === nomeProduto);
  if (!produto) return;
  if (produto.disponivel !== 'sim') {
    alert('Este produto não está disponível no momento.');
    return;
  }
  const carrinho = getCarrinho();
  // Evitar duplicados do mesmo produto
  if (carrinho.find(i => i.nome === produto.nome)) {
    alert('Este produto já está no carrinho!');
    return;
  }
  carrinho.push({
    nome: produto.nome,
    preco: produto.preco,
    categoria: produto.categoria,
    icone: produto.icone,
    cor: produto.cor
  });
  salvarCarrinho(carrinho);
  atualizarBadge();

  // Feedback visual
  const btn = event && event.target ? event.target : null;
  if (btn) {
    const original = btn.textContent;
    btn.textContent = '✅ Adicionado!';
    btn.style.background = '#2ecc71';
    setTimeout(() => {
      btn.textContent = original;
      btn.style.background = '';
    }, 1500);
  }
};

// =============================================
// PARSER DO ARQUIVO .TXT
// =============================================

function parseProdutosTxt(texto) {
  const produtos = [];
  const blocos = texto.split('[PRODUTO]').filter(b => b.trim() && !b.trim().startsWith('#'));

  blocos.forEach(bloco => {
    const linhas = bloco.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
    const produto = {};
    linhas.forEach(linha => {
      const idx = linha.indexOf('=');
      if (idx === -1) return;
      const chave = linha.substring(0, idx).trim().toLowerCase();
      const valor = linha.substring(idx + 1).trim();
      produto[chave] = valor;
    });
    if (produto.nome && produto.preco) {
      // Defaults
      produto.categoria = produto.categoria || 'itens';
      produto.disponivel = produto.disponivel || 'sim';
      produto.destaque = produto.destaque || 'nao';
      produto.icone = produto.icone || 'diamond';
      produto.cor = produto.cor || '#00d4ff';
      produto.descricao = produto.descricao || 'Sem descrição.';
      produtos.push(produto);
    }
  });

  return produtos;
}

// =============================================
// CARREGAMENTO DE PRODUTOS
// =============================================

let _cachePromise = null;

async function carregarProdutos() {
  if (_cachePromise) return _cachePromise;

  _cachePromise = (async () => {
    // Tenta URL principal primeiro
    const urls = [PRODUTOS_URL, PRODUTOS_URL_FALLBACK];
    
    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) continue;
        const texto = await res.text();
        const produtos = parseProdutosTxt(texto);
        if (produtos.length > 0) {
          window._produtosCarregados = produtos;
          return produtos;
        }
      } catch (e) {
        console.warn('Falha ao buscar:', url, e);
      }
    }

    // Se ambas falharem, retorna produtos de demonstração
    console.warn('Usando produtos de demonstração (falha ao carregar .txt)');
    const demo = getDemoProdutos();
    window._produtosCarregados = demo;
    return demo;
  })();

  return _cachePromise;
}

// =============================================
// PRODUTOS DE DEMONSTRAÇÃO (fallback)
// =============================================

function getDemoProdutos() {
  return [
    { nome: 'VIP Floravia', categoria: 'ranks', preco: '19.90', descricao: 'Rank VIP no servidor Floravia!', icone: 'diamond', destaque: 'sim', disponivel: 'sim', cor: '#00d4ff' },
    { nome: 'MVP Floravia', categoria: 'ranks', preco: '39.90', descricao: 'Rank MVP premium!', icone: 'netherite_ingot', destaque: 'sim', disponivel: 'sim', cor: '#FFD700' },
    { nome: 'Kit Guerreiro', categoria: 'kits', preco: '9.90', descricao: 'Kit de combate PvP!', icone: 'iron_sword', destaque: 'nao', disponivel: 'sim', cor: '#C0C0C0' },
  ];
}

// =============================================
// ÍCONES MINECRAFT → EMOJI
// =============================================

function getIconeEmoji(icone) {
  const mapa = {
    diamond: '💎',
    netherite_ingot: '⬛',
    iron_sword: '⚔️',
    diamond_sword: '⚔️',
    netherite_sword: '🗡️',
    diamond_pickaxe: '⛏️',
    iron_pickaxe: '⛏️',
    bow: '🏹',
    shield: '🛡️',
    elytra: '🪶',
    chest: '📦',
    experience_bottle: '🧪',
    name_tag: '🏷️',
    gold_ingot: '🥇',
    emerald: '💚',
    sword: '⚔️',
    pickaxe: '⛏️',
    armor: '🛡️',
    helmet: '⛑️',
    potion: '🧪',
    apple: '🍎',
    book: '📖',
    map: '🗺️',
    compass: '🧭',
    crown: '👑',
    star: '⭐',
  };
  if (!icone) return '📦';
  const key = icone.toLowerCase();
  for (const [k, v] of Object.entries(mapa)) {
    if (key.includes(k)) return v;
  }
  return '📦';
}

// =============================================
// CRIAR CARD DE PRODUTO (HTML)
// =============================================

function criarCardProduto(p) {
  const icone = getIconeEmoji(p.icone);
  const indisponivel = p.disponivel !== 'sim';
  return `
    <div class="produto-card ${indisponivel ? 'indisponivel' : ''}" style="--produto-cor: ${p.cor || '#00d4ff'}">
      ${p.destaque === 'sim' ? '<div class="card-badge-destaque">⭐ Destaque</div>' : ''}
      ${indisponivel ? '<div class="card-badge-off">Indisponível</div>' : ''}
      <div class="card-icon">${icone}</div>
      <div class="card-cat">${p.categoria}</div>
      <h3 class="card-nome">${p.nome}</h3>
      <p class="card-desc">${p.descricao.length > 80 ? p.descricao.substring(0, 80) + '...' : p.descricao}</p>
      <div class="card-footer">
        <span class="card-preco">R$ ${p.preco}</span>
        <div class="card-btns">
          <button class="btn-info" onclick="abrirModal ? abrirModal('${p.nome.replace(/'/g, "\\'")}') : null">Detalhes</button>
          ${!indisponivel
            ? `<button class="btn-add" onclick="adicionarCarrinho('${p.nome.replace(/'/g, "\\'")}')">+ Carrinho</button>`
            : '<button class="btn-disabled" disabled>Esgotado</button>'
          }
        </div>
      </div>
    </div>
  `;
}

// Inicializar badge ao carregar
document.addEventListener('DOMContentLoaded', atualizarBadge);
