// Constantes Globais
const naipes = ['♠', '♥', '♦', '♣'];
const valores = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'Curinga'];
const valorCarta = (c) => (c === 'Curinga' ? 'Curinga' : c.slice(0, -1));
const naipeCarta = (c) => (c === 'Curinga' ? '' : c.slice(-1));

// Variáveis de Estado
let baralho = [], descarte = [];
let jogador1 = [], morto1 = [], pegouMorto1 = false;
let jogador2 = [], morto2 = [], pegouMorto2 = false;
let baixados1 = [], baixados2 = [];
let pontosRodada1 = 0, pontosRodada2 = 0;
let pontosTotal1 = 0, pontosTotal2 = 0;
let turno = 1, comprou = false;
let gameMode = '', pegandoDoDescarte = false;
let esperandoSelecaoDeJogoParaLixo = false; 
let modoPegarLixoAtivo = false;      
let jogoAlvoParaLixo = null;       
let cartasDaMaoParaLixo = [];
let memoriaDescarteIA = [];    


// Elementos do DOM
const mao1El = document.getElementById("maoJogador1");
const mao2El = document.getElementById("maoJogador2");
const descarteEl = document.getElementById("descarteTopo");
const descarteContagemEl = document.getElementById("descarteContagem");
const monteContagemEl = document.getElementById("monteContagem");
const infoTurno = document.getElementById("turnoInfo");
const pontosTotal1El = document.getElementById("pontosTotal1");
const pontosRodada1El = document.getElementById("pontosRodada1");
const pontosTotal2El = document.getElementById("pontosTotal2");
const pontosRodada2El = document.getElementById("pontosRodada2");
const overlay = document.getElementById("overlay");
const overlayTexto = document.getElementById("overlayTexto");
const btnConfirmar = document.getElementById("confirmarTurno");
const menuEl = document.getElementById("menuPrincipal");
const areaJogoEl = document.getElementById("areaJogo");
const btnPVP = document.getElementById("btnPVP");
const btnPVE = document.getElementById("btnPVE");
const btnComprarMonte = document.getElementById("comprarMonte");
const btnComprarDescarte = document.getElementById("comprarDescarte");
const btnDescartar = document.getElementById("descartar");
const btnBaixar = document.getElementById("baixar");
const acoesNormaisEl = document.getElementById("acoesNormais");         
const acoesPegarLixoEl = document.getElementById("acoesPegarLixo");       
const btnConfirmarPegadaEl = document.getElementById("btnConfirmarPegada"); 
const btnCancelarPegadaEl = document.getElementById("btnCancelarPegada");
// (Junto com as outras constantes de elementos)
const fimRodadaOverlay = document.getElementById('fimRodadaOverlay');
const fimRodadaTitulo = document.getElementById('fimRodadaTitulo');
const fimRodadaSubtitulo = document.getElementById('fimRodadaSubtitulo');
// ... (vamos pegar o resto dentro da função para simplificar)
const btnProximaRodada = document.getElementById('btnProximaRodada');   

// --- INICIALIZAÇÃO ---
btnPVP.onclick = () => { gameMode = 'pvp'; document.getElementById('labelJogador2').textContent = 'Jogador 2'; iniciarPartida(); };
btnPVE.onclick = () => { gameMode = 'pve'; document.getElementById('labelJogador2').textContent = 'Máquina'; iniciarPartida(); };
btnCancelarPegadaEl.onclick = sairModoPegarLixo;
btnConfirmarPegadaEl.onclick = executarPegadaDoLixo;
// (Junto com os outros btn...onclick)
btnProximaRodada.onclick = () => {
    fimRodadaOverlay.style.display = 'none';
    iniciarRodada();
};

function iniciarPartida() {
    menuEl.style.display = 'none';
    areaJogoEl.style.display = 'block';
    pontosTotal1 = 0;
    pontosTotal2 = 0;
    iniciarRodada();
}

function iniciarRodada() {
    baralho = criarBaralho(); descarte = [];
    jogador1 = baralho.splice(0, 11); morto1 = baralho.splice(0, 11); pegouMorto1 = false;
    jogador2 = baralho.splice(0, 11); morto2 = baralho.splice(0, 11); pegouMorto2 = false;
    descarte.push(baralho.pop());
    baixados1 = []; baixados2 = [];
    pontosRodada1 = 0; pontosRodada2 = 0;
    turno = 1; comprou = false; pegandoDoDescarte = false;
    memoriaDescarteIA = []; // <-- ADICIONE A LINHA AQUI
    infoTurno.textContent = `Turno do Jogador 1`;
    btnConfirmar.textContent = "Confirmar e Jogar";
    btnConfirmar.onclick = () => { overlay.style.display = "none"; renderizar(); };
    renderizar();
}
    


btnConfirmar.onclick = () => { overlay.style.display = "none"; renderizar(); };
btnComprarMonte.onclick = () => comprar('monte');
btnComprarDescarte.onclick = () => comprar('descarte');
btnDescartar.onclick = descartar;
btnBaixar.onclick = baixarSelecionadas;

function entrarModoPegarLixo() {
    modoPegarLixoAtivo = true;
    acoesNormaisEl.style.display = 'none';
    acoesPegarLixoEl.style.display = 'block';
    infoTurno.textContent = "Selecione um jogo na mesa e/ou cartas da mão.";
}

function sairModoPegarLixo() {
    modoPegarLixoAtivo = false;
    jogoAlvoParaLixo = null;
    cartasDaMaoParaLixo = [];
    
    // Limpa a seleção visual das cartas e jogos
    document.querySelectorAll('.carta.selecionada-lixo, .jogo.selecionado-lixo').forEach(el => {
        el.classList.remove('selecionada-lixo');
    });

    acoesNormaisEl.style.display = 'block';
    acoesPegarLixoEl.style.display = 'none';
    btnConfirmarPegadaEl.disabled = true;
    infoTurno.textContent = `Turno do Jogador ${turno}`;
    renderizar(); // Re-renderiza para limpar o estado visual
}

function validarPegadaProposta() {
    // Para validar, precisamos ou de um jogo alvo da mesa OU de pelo menos 2 cartas da mão
    // (para formar um jogo novo de 3 cartas com a do lixo)
    if (!jogoAlvoParaLixo && cartasDaMaoParaLixo.length < 2) {
        btnConfirmarPegadaEl.disabled = true;
        return;
    }

    const cartaDoTopo = descarte[descarte.length - 1];
    const jogoBase = jogoAlvoParaLixo ? [...jogoAlvoParaLixo] : [];
    const jogoProposto = [...jogoBase, ...cartasDaMaoParaLixo, cartaDoTopo];

    if (formaJogo(jogoProposto)) {
        btnConfirmarPegadaEl.disabled = false;
    } else {
        btnConfirmarPegadaEl.disabled = true;
    }
}

// --- CORREÇÃO 3: PEGAR O LIXO ---
function executarPegadaDoLixo() {
    // Memoriza a carta para a IA
    const cartaDoTopo = descarte[descarte.length - 1];
    if (cartaDoTopo && turno === 1) {
        memoriaDescarteIA.push(cartaDoTopo);
    }

    const mao = turno === 1 ? jogador1 : jogador2;
    const baixados = turno === 1 ? baixados1 : baixados2;

    // Pega o lixo inteiro para a mão primeiro
    mao.push(...descarte);
    descarte.length = 0;

    // Agora, move as cartas da mão para a mesa
    const cartasParaBaixar = [...cartasDaMaoParaLixo, cartaDoTopo];

    // Remove as cartas do jogo da mão do jogador
    cartasParaBaixar.forEach(carta => {
        const index = mao.indexOf(carta);
        if (index > -1) {
            mao.splice(index, 1);
        }
    });

    // Adiciona ao jogo existente ou cria um novo
    if (jogoAlvoParaLixo) {
        jogoAlvoParaLixo.push(...cartasParaBaixar);
    } else {
        baixados.push(cartasParaBaixar);
    }

    comprou = true;
    sairModoPegarLixo(); // Limpa o estado e atualiza a tela
}

function criarBaralho() {
    let deck = [];
    for (let i = 0; i < 2; i++) {
        for (let n of naipes) {
            for (let v of valores) {
                if (v === 'Curinga') continue; // Curingas são adicionados separadamente
                deck.push(v + n);
            }
        }
        // Adiciona os 2 Curingas por baralho
        deck.push('Curinga');
        deck.push('Curinga');
    }
    return embaralhar(deck);
}
function embaralhar(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[array[i], array[j]] = [array[j], array[i]]; } return array; }


// --- RENDERIZAÇÃO ---
function renderizar() {
    const overlayVisivel = overlay.style.display !== 'none';
    const mostrarMao1 = turno === 1 && !overlayVisivel;
    const mostrarMao2 = turno === 2 && !overlayVisivel && gameMode === 'pvp';

    mao1El.innerHTML = ""; mao2El.innerHTML = "";
    document.getElementById("jogosBaixados1").innerHTML = "";
    document.getElementById("jogosBaixados2").innerHTML = "";

    function criarElementoCarta(carta, maoContainer, podeClicar, deveMostrar) {
        const el = document.createElement("div");
        el.className = "carta";
    
        if (deveMostrar) {
            el.textContent = carta; // Lógica simples: apenas escreve o nome da carta
            if (podeClicar) el.onclick = () => selecionarCarta(el);
    
            // Aplica a cor do naipe a TODAS as cartas que têm naipe (incluindo o "2")
            if (carta !== 'Curinga') {
                const naipe = naipeCarta(carta);
                if (naipe === '♥') el.classList.add('copas');
                else if (naipe === '♣') el.classList.add('paus');
                else if (naipe === '♠') el.classList.add('espadas');
                else if (naipe === '♦') el.classList.add('ouros');
            }
        } else {
            el.textContent = '🃏';
            el.classList.add('carta-oculta');
        }
        
        maoContainer.appendChild(el);
    
        // Animação de fade-in/slide-in
        setTimeout(() => {
            el.style.opacity = 1;
            el.style.transform = 'translateY(0)';
        }, 10);
    }
    
    jogador1.forEach(carta => criarElementoCarta(carta, mao1El, turno === 1, mostrarMao1));
    jogador2.forEach(carta => criarElementoCarta(carta, mao2El, turno === 2 && gameMode === 'pvp', mostrarMao2));

    monteContagemEl.textContent = baralho.length;
    descarteEl.textContent = descarte.length > 0 ? descarte[descarte.length - 1] : "?";
    descarteContagemEl.textContent = descarte.length;
    atualizarPlacar();
    exibirJogosBaixados(baixados1, document.getElementById("jogosBaixados1"));
    exibirJogosBaixados(baixados2, document.getElementById("jogosBaixados2"));
    
    // A lógica de habilitar/desabilitar botões deve estar em outro lugar, como na renderização ou após cada ação.
    // Para simplificar, vamos garantir que eles comecem em um estado padrão e sejam atualizados pela 'selecionarCarta'.
    btnDescartar.disabled = true; 
    btnBaixar.disabled = true;
}
// --- LÓGICA DE JOGO E AÇÕES ---
function tentarReabastecerMonte() {
    if (!pegouMorto1 && morto1.length > 0) {
        alert("O monte acabou! O primeiro morto será usado como novo monte.");
        baralho.push(...morto1);
        morto1 = [];
        pegouMorto1 = true; 
        embaralhar(baralho);
        return true;
    } 
    else if (!pegouMorto2 && morto2.length > 0) {
        alert("O monte acabou novamente! O segundo morto será usado como novo monte.");
        baralho.push(...morto2);
        morto2 = [];
        pegouMorto2 = true;
        embaralhar(baralho);
        return true;
    } 
    else {
        return false;
    }
}

function comprar(tipo) {
    // Se o modo especial estiver ativo, o botão de comprar do monte não faz nada
    if (modoPegarLixoAtivo && tipo === 'monte') return; 

    // Se já comprou no turno, não faz nada
    if (comprou) return;

    if (tipo === 'monte') {
        const mao = turno === 1 ? jogador1 : jogador2;
        if (baralho.length === 0 && !tentarReabastecerMonte()) {
            fimDoJogoPorFaltaDeCartas();
            return;
        }
        mao.push(baralho.pop());
        comprou = true;
    } else if (tipo === 'descarte') {
        if (descarte.length === 0) return;
        // Apenas entra no modo especial
        entrarModoPegarLixo();
    }
    renderizar();
}
   

function tentarPegarLixoComJogoExistente(jogo) {
    const cartaDoTopo = descarte[descarte.length - 1];
    const mao = turno === 1 ? jogador1 : jogador2;

    // Verifica se a carta do topo pode ser adicionada ao jogo selecionado
    if (podeAdicionarCartaAoJogo(cartaDoTopo, jogo)) {
        // Sucesso! O jogador pega o lixo.
        const lixoInteiro = [...descarte];
        descarte.length = 0; // Esvazia o descarte
        mao.push(...lixoInteiro); // Adiciona todas as cartas do lixo à mão

        // Remove a carta do topo da mão do jogador para colocá-la no jogo da mesa
        mao.splice(mao.lastIndexOf(cartaDoTopo), 1);
        jogo.push(cartaDoTopo);

        // Atualiza o estado do jogo
        comprou = true;
        esperandoSelecaoDeJogoParaLixo = false;
        pegandoDoDescarte = false; 
        infoTurno.textContent = "Lixo pego! Agora descarte uma carta.";
        btnComprarMonte.textContent = "Comprar do Monte";
        
        renderizar();
    } else {
        alert("A carta do lixo (" + cartaDoTopo + ") não pode ser adicionada a este jogo.");
    }
}

function proximoTurno() {
    turno = turno === 1 ? 2 : 1; comprou = false; pegandoDoDescarte = false;
    const nomeProximoJogador = (turno === 1 || gameMode === 'pvp') ? `Jogador ${turno}` : 'Máquina';
    infoTurno.textContent = `Turno de: ${nomeProximoJogador}`;
    btnBaixar.textContent = "Baixar Seleção"; btnComprarMonte.textContent = "Comprar do Monte";
    renderizar();
    if (turno === 2 && gameMode === 'pve') {
        setTimeout(jogadaIA, 1200);
    } else {
        overlayTexto.textContent = `Vez do ${nomeProximoJogador}`;
        overlay.style.display = "flex";
    }
}
function selecionarCarta(cartaEl) {
    if (modoPegarLixoAtivo) {
        const carta = cartaEl.textContent;
        const index = cartasDaMaoParaLixo.indexOf(carta);

        if (index > -1) { // Se já selecionou, des-seleciona
            cartasDaMaoParaLixo.splice(index, 1);
            cartaEl.classList.remove('selecionada-lixo');
        } else { // Senão, seleciona
            cartasDaMaoParaLixo.push(carta);
            cartaEl.classList.add('selecionada-lixo');
        }
        validarPegadaProposta(); // Valida a jogada a cada clique
    } else {
        // Lógica normal de seleção de cartas
        cartaEl.classList.toggle("selecionada");
        const maoEl = turno === 1 ? mao1El : mao2El;
        const selecionadas = maoEl.querySelectorAll(".carta.selecionada");
        btnBaixar.disabled = !comprou || selecionadas.length < 3;
        btnDescartar.disabled = !comprou || selecionadas.length !== 1;
    }
}
function baixarSelecionadas() {
    const mao = turno === 1 ? jogador1 : jogador2;
    const baixados = turno === 1 ? baixados1 : baixados2;
    const maoEl = turno === 1 ? mao1El : mao2El;
    const selecionadasEls = maoEl.querySelectorAll(".carta.selecionada");
    
    const selecionadas = Array.from(selecionadasEls).map(el => el.textContent);
    
    if (!formaJogo(selecionadas)) { 
        alert("Jogo inválido! As cartas selecionadas não formam uma sequência válida."); 
        return; 
    }
   
    selecionadas.forEach(carta => mao.splice(mao.indexOf(carta), 1));
    baixados.push(selecionadas);

    if (mao.length === 0) {
        const jaPegouMorto = (turno === 1 && pegouMorto1) || (turno === 2 && pegouMorto2);
        if (jaPegouMorto) {
            if (temCanastraLimpa(baixados)) {
                fimDoJogo(turno);
                return;
            } else {
                alert("Batida inválida! É necessário ter pelo menos uma Canastra Limpa para bater.");
                mao.push(...selecionadas);
                baixados.pop();
                renderizar();
                return;
            }
        } else {
            const morto = turno === 1 ? morto1 : morto2;
            mao.push(...morto);
            if (turno === 1) { pegouMorto1 = true; morto1 = []; }
            else { pegouMorto2 = true; morto2 = []; }
            alert(`Jogador ${turno} pegou o morto!`);
            comprou = true;
        }
    }

    btnDescartar.disabled = false;
    btnBaixar.disabled = true;
    selecionadasEls.forEach(c => c.classList.remove("selecionada"));
    renderizar();
}

function descartar() {
    const mao = turno === 1 ? jogador1 : jogador2;
    const baixados = turno === 1 ? baixados1 : baixados2;
    const maoEl = turno === 1 ? mao1El : mao2El;
    const selecionada = maoEl.querySelector(".carta.selecionada");
    
    if (!selecionada) return;
    
    let carta = selecionada.textContent;
    mao.splice(mao.indexOf(carta), 1);
    descarte.push(carta);

    // Verifica se a mão esvaziou
    if (mao.length === 0) {
        const jaPegouMorto = (turno === 1 && pegouMorto1) || (turno === 2 && pegouMorto2);
        
        if (jaPegouMorto) {
            // Se já pegou o morto, tenta bater o jogo final
            if (temCanastraLimpa(baixados)) { 
                fimDoJogo(turno); 
                return; 
            } else { 
                alert("Batida inválida! É necessário ter pelo menos uma Canastra Limpa para bater."); 
                // Devolve a carta para a mão e cancela o descarte
                mao.push(descarte.pop()); 
                renderizar(); 
                return; 
            }
        } else {
            // --- CORREÇÃO AQUI ---
            // Jogador bateu para pegar o morto DESCARTANDO.
            // Regra: Pega o morto e PASSA A VEZ.
            
            const morto = turno === 1 ? morto1 : morto2;
            mao.push(...morto);
            
            if (turno === 1) { pegouMorto1 = true; morto1 = []; }
            else { pegouMorto2 = true; morto2 = []; }
            
            alert(`Jogador ${turno} pegou o morto no descarte! A vez passa para o oponente.`);
            
            // Forçamos a renderização para atualizar a mão com o morto visualmente antes de trocar
            renderizar(); 
            
            // Chama o próximo turno porque houve descarte
            proximoTurno(); 
            return;
        }
    }
    
    // Se a mão não acabou, segue o fluxo normal de troca de turno
    proximoTurno();
}
// --- REGRAS STBL, PONTUAÇÃO E IA ---
function formaJogo(cartas) {
    const uniqueCards = new Set(cartas);
    if (uniqueCards.size !== cartas.length) return false;
    if (cartas.length < 3) return false;

    const curingasVerdadeiros = cartas.filter(c => c === 'Curinga');
    const doises = cartas.filter(c => valorCarta(c) === '2');
    const naturais = cartas.filter(c => c !== 'Curinga' && valorCarta(c) !== '2');

    if (naturais.length === 0) return false;

    const naipeBase = naipeCarta(naturais[0]);
    if (!naturais.every(c => naipeCarta(c) === naipeBase)) return false;

    const doisDoNaipe = doises.find(d => naipeCarta(d) === naipeBase);
    const doisCuringa = doises.filter(d => naipeCarta(d) !== naipeBase);
    const coringasExternos = [...curingasVerdadeiros, ...doisCuringa];

    const hipoteseNaturais = doisDoNaipe ? [...naturais, doisDoNaipe] : [...naturais];
    
    let indicesHipotese = hipoteseNaturais.map(c => valores.indexOf(valorCarta(c)));
    if (indicesHipotese.includes(0) && indicesHipotese.some(i => i >= 10)) {
        const aIndex = indicesHipotese.indexOf(0);
        indicesHipotese.splice(aIndex, 1);
        indicesHipotese.push(13);
    }
    indicesHipotese.sort((a, b) => a - b);

    let falhasHipotese = 0;
    for (let i = 0; i < indicesHipotese.length - 1; i++) {
        const diff = indicesHipotese[i + 1] - indicesHipotese[i];
        if (diff > 1) falhasHipotese += diff - 1;
    }

    if (falhasHipotese <= coringasExternos.length) {
        if (coringasExternos.length > 1) return false;
        return hipoteseNaturais.length > coringasExternos.length;
    } else {
        const coringasAtivos = [...curingasVerdadeiros, ...doises];
        if (coringasAtivos.length > 1) return false;

        const cartasParaSequencia = naturais;
        if (cartasParaSequencia.length <= coringasAtivos.length) return false;

        let indices = cartasParaSequencia.map(c => valores.indexOf(valorCarta(c)));
        if (indices.includes(0) && indices.some(i => i >= 10)) {
            const aIndex = indices.indexOf(0);
            indices.splice(aIndex, 1);
            indices.push(13);
        }
        indices.sort((a, b) => a - b);

        let falhas = 0;
        for (let i = 0; i < indices.length - 1; i++) {
            const diff = indices[i + 1] - indices[i];
            if (diff > 1) falhas += diff - 1;
        }
        return falhas <= coringasAtivos.length;
    }
}
/**
 * Verifica se um jogo é considerado "limpo" ou "sujo" de acordo com as regras finais.
 * Retorna true se for limpo, false se for sujo.
 */
function verificarLimpezaDoJogo(jogo) {
    // 1. Se tiver um Curinga verdadeiro, é sempre sujo.
    if (jogo.some(c => c === 'Curinga')) {
        return false;
    }

    // 2. Separa os '2s' e as cartas naturais.
    const doises = jogo.filter(c => valorCarta(c) === '2');
    const naturais = jogo.filter(c => valorCarta(c) !== '2');

    // Se não houver '2s', o jogo é limpo.
    if (doises.length === 0) {
        return true;
    }

    // Define o naipe base do jogo
    const naipeBase = naipeCarta(naturais[0]);

    // 3. Para ser limpo, todos os '2s' devem ser do mesmo naipe do jogo.
    const todosOsDoisesSaoDoNaipe = doises.every(d => naipeCarta(d) === naipeBase);
    if (!todosOsDoisesSaoDoNaipe) {
        return false; // Encontrou um '2' de naipe diferente, então o jogo é sujo.
    }

    // 4. Se todos os '2s' são do naipe correto, verifica se estão na posição natural.
    // Para isso, a sequência inteira (naturais + '2s') não pode ter buracos.
    const todosIndices = jogo.map(c => valores.indexOf(valorCarta(c))).sort((a, b) => a - b);

    for (let i = 0; i < todosIndices.length - 1; i++) {
        // Se houver qualquer "buraco", significa que um '2' (mesmo sendo do naipe certo)
        // está sendo usado como tapa-buraco, então o jogo é sujo.
        if (todosIndices[i + 1] - todosIndices[i] !== 1) {
            return false;
        }
    }

    // Se passou por todas as verificações, o jogo é limpo.
    return true;
}


function podeAdicionarCartaAoJogo(carta, jogo) {
    const novoJogo = [...jogo, carta];
    return formaJogo(novoJogo);
}
// --- CORREÇÃO 2: ADICIONAR CARTA ---
// SUBSTITUA A SUA FUNÇÃO INTEIRA POR ESTA
function adicionarCartaAoJogo(jogo, jogadorId) {
    if (!comprou) {
        alert("Você precisa comprar uma carta antes de adicionar a um jogo existente.");
        return;
    }
    const mao = (jogadorId === 1) ? jogador1 : jogador2;
    const maoEl = (jogadorId === 1) ? mao1El : mao2El;
    const selecionadaEl = maoEl.querySelector(".carta.selecionada");

    if (!selecionadaEl || maoEl.querySelectorAll(".carta.selecionada").length > 1) {
        alert("Para adicionar a um jogo, selecione exatamente UMA carta da sua mão.");
        return;
    }

    const cartaParaAdicionar = selecionadaEl.textContent;

    if (podeAdicionarCartaAoJogo(cartaParaAdicionar, jogo)) {
        mao.splice(mao.indexOf(cartaParaAdicionar), 1);
        jogo.push(cartaParaAdicionar);
        
        if (mao.length === 0) {
            const jaPegouMorto = (jogadorId === 1 && pegouMorto1) || (jogadorId === 2 && pegouMorto2);
            const baixados = (jogadorId === 1) ? baixados1 : baixados2;
            if (jaPegouMorto) {
                if (temCanastraLimpa(baixados)) {
                    fimDoJogo(jogadorId);
                    return; 
                } else {
                    alert("Batida inválida! É necessário ter pelo menos uma Canastra Limpa para bater.");
                    jogo.pop();
                    mao.push(cartaParaAdicionar);
                    renderizar();
                    return;
                }
            } else { 
                const morto = jogadorId === 1 ? morto1 : morto2;
                mao.push(...morto);
                if (jogadorId === 1) { pegouMorto1 = true; morto1 = []; }
                else { pegouMorto2 = true; morto2 = []; }
                alert(`Jogador ${jogadorId} pegou o morto!`);
                comprou = true;
            }
        }

        btnDescartar.disabled = false;
        selecionadaEl.classList.remove('selecionada'); 
        renderizar();
    } else {
        alert("Esta carta não pode ser adicionada a este jogo.");
    }
}
function temCanastraLimpa(listaJogos) {
    // Procura por pelo menos um jogo que seja uma canastra (>= 7 cartas) E que seja limpo.
    return listaJogos.some(jogo => jogo.length >= 7 && verificarLimpezaDoJogo(jogo));
}

function calcularPontosDaJogada(jogo, jogadorTurno, aplicarPontos = true) {
    const pontosJogada = jogo.reduce((acc, c) => {
        if (c === 'Curinga') return acc + 50; // Pontos do Curinga
        const valor = valorCarta(c);
        if (['J', 'Q', 'K', '10'].includes(valor)) return acc + 10;
        if (valor === 'A') return acc + 15;
        if (valor === '2') return acc + 10; // '2' continua valendo 10
        return acc + 5;
    }, 0);
   

    if (aplicarPontos) {
        if (jogadorTurno === 1) { pontosRodada1 += pontosJogada; }
        else { pontosRodada2 += pontosJogada; }
        atualizarPlacar();
    }
    
    return pontosJogada;
}

function fimDoJogo(vencedor) {
    const pontos = calcularPontosFinais(vencedor);
    pontosTotal1 += pontos.totalRodada1;
    pontosTotal2 += pontos.totalRodada2;

    // Preenche e exibe o modal
    document.getElementById('fimRodadaTitulo').textContent = 'Fim da Rodada!';
    document.getElementById('fimRodadaSubtitulo').textContent = `Jogador ${vencedor} bateu!`;
    preencherResumo(pontos);
    fimRodadaOverlay.style.display = 'flex';
}

function fimDoJogoPorFaltaDeCartas() {
    const pontos = calcularPontosFinais(null); // null indica que ninguém bateu
    pontosTotal1 += pontos.totalRodada1;
    pontosTotal2 += pontos.totalRodada2;

    // Preenche e exibe o modal
    document.getElementById('fimRodadaTitulo').textContent = 'Fim da Rodada!';
    document.getElementById('fimRodadaSubtitulo').textContent = 'As cartas do monte acabaram!';
    preencherResumo(pontos);
    fimRodadaOverlay.style.display = 'flex';
}

function getCardValue(carta) {
    // Adiciona uma verificação de segurança para o caso de a carta ser inválida.
    if (!carta) return 0;

    const valor = valorCarta(carta);

    if (valor === 'Curinga') return 50;
    if (valor === 'A') return 15;
    
    // --- LÓGICA CORRIGIDA ---
    // Usando uma lista, que é 100% seguro e não tem o bug de comparação de texto.
    if (['K', 'Q', 'J', '10', '9', '8'].includes(valor)) {
        return 10;
    }
    // --- FIM DA CORREÇÃO ---

    if (valor === '2') return 10; // O valor do '2' pode ser ajustado aqui se necessário
    
    // Se não for nenhuma das acima, vale 5 (cartas 3, 4, 5, 6, 7)
    return 5;
}

function preencherResumo(pontos) {
    // Nomes Jogadores
    const nomeJogador2 = gameMode === 'pve' ? 'Máquina' : 'Jogador 2';
    document.getElementById('resumoNomeJogador2').textContent = nomeJogador2;
    document.getElementById('resumoNomeJogador2_placar').textContent = nomeJogador2;

    // Coluna Jogador 1
    document.getElementById('resumoMesa1').textContent = pontos.pontosMesa1;
    document.getElementById('resumoBatida1').textContent = pontos.bonusBatida1;
    document.getElementById('resumoCanastras1').textContent = pontos.bonusCanastras1;
    document.getElementById('resumoMao1').textContent = pontos.penalidadeMao1;
    document.getElementById('resumoMorto1').textContent = pontos.penalidadeMorto1;
    document.getElementById('resumoRodada1').textContent = pontos.totalRodada1;

    // Coluna Jogador 2
    document.getElementById('resumoMesa2').textContent = pontos.pontosMesa2;
    document.getElementById('resumoBatida2').textContent = pontos.bonusBatida2;
    document.getElementById('resumoCanastras2').textContent = pontos.bonusCanastras2;
    document.getElementById('resumoMao2').textContent = pontos.penalidadeMao2;
    document.getElementById('resumoMorto2').textContent = pontos.penalidadeMorto2;
    document.getElementById('resumoRodada2').textContent = pontos.totalRodada2;

    // Placar Geral
    document.getElementById('resumoTotal1').textContent = pontosTotal1;
    document.getElementById('resumoTotal2').textContent = pontosTotal2;
}

function calcularPontosFinais(vencedor) {
    // --- INÍCIO DA CORREÇÃO ---
    // Pontos das cartas na mesa (reescrito sem usar .flat())
    let pontosMesa1 = 0;
    baixados1.forEach(jogo => {
        jogo.forEach(carta => {
            pontosMesa1 += getCardValue(carta);
        });
    });

    let pontosMesa2 = 0;
    baixados2.forEach(jogo => {
        jogo.forEach(carta => {
            pontosMesa2 += getCardValue(carta);
        });
    });
    // --- FIM DA CORREÇÃO ---

    let bonusBatida1 = 0, bonusBatida2 = 0;
    let bonusCanastras1 = 0, bonusCanastras2 = 0;

    // Bônus de Canastras
    baixados1.forEach(jogo => {
        if (jogo.length >= 7) {
            if (verificarLimpezaDoJogo(jogo)) bonusCanastras1 += 200; else bonusCanastras1 += 100;
        }
    });
    baixados2.forEach(jogo => {
        if (jogo.length >= 7) {
            if (verificarLimpezaDoJogo(jogo)) bonusCanastras2 += 200; else bonusCanastras2 += 100;
        }
    });

    // Bônus da Batida
    if (vencedor === 1) bonusBatida1 = 100;
    else if (vencedor === 2) bonusBatida2 = 100;

    // Penalidades
    const penalidadeMao1 = jogador1.reduce((acc, c) => acc + getCardValue(c), 0);
    const penalidadeMao2 = jogador2.reduce((acc, c) => acc + getCardValue(c), 0);
    let penalidadeMorto1 = 0, penalidadeMorto2 = 0;

    if (!pegouMorto1) penalidadeMorto1 = 100;
    if (!pegouMorto2) penalidadeMorto2 = 100;
    
    const totalRodada1 = pontosMesa1 + bonusBatida1 + bonusCanastras1 - penalidadeMao1 - penalidadeMorto1;
    const totalRodada2 = pontosMesa2 + bonusBatida2 + bonusCanastras2 - penalidadeMao2 - penalidadeMorto2;
    
    return { 
        pontosMesa1, bonusBatida1, bonusCanastras1, penalidadeMao1, penalidadeMorto1, totalRodada1,
        pontosMesa2, bonusBatida2, bonusCanastras2, penalidadeMao2, penalidadeMorto2, totalRodada2
    };
}
function prepararProximaRodada() {
    overlayTexto.textContent = "Próxima Rodada";
    btnConfirmar.textContent = "Começar";
    btnConfirmar.onclick = iniciarRodada;
    overlay.style.display = "flex";
}

function atualizarPlacar() {
    pontosTotal1El.textContent = pontosTotal1;
    pontosRodada1El.textContent = pontosRodada1;
    pontosTotal2El.textContent = pontosTotal2;
    pontosRodada2El.textContent = pontosRodada2;
}

function exibirJogosBaixados(listaJogos, container) {

    const jogadorId = (container.id === 'jogosBaixados1') ? 1 : 2;
    container.innerHTML = '';
    
    listaJogos.forEach((jogo) => {
        // Ordena as cartas do jogo para exibição
        jogo.sort((a, b) => {
            let indiceA = valores.indexOf(valorCarta(a));
            let indiceB = valores.indexOf(valorCarta(b));
            const temRei = jogo.some(c => valorCarta(c) === 'K');
            if(temRei && valorCarta(a) === 'A') indiceA = 13;
            if(temRei && valorCarta(b) === 'A') indiceB = 13;
            return indiceA - indiceB;
        });
        
        const jogoDiv = document.createElement("div");
        jogoDiv.className = "jogo";
        
        // Lógica de clique para "Pegar Lixo" ou "Adicionar Carta"
        if (modoPegarLixoAtivo && turno === jogadorId) {
            jogoDiv.style.cursor = "pointer";
            jogoDiv.onclick = () => {
                if (jogoAlvoParaLixo === jogo) {
                    jogoAlvoParaLixo = null;
                    jogoDiv.classList.remove('selecionado-lixo');
                } else {
                    document.querySelector('.jogo.selecionado-lixo')?.classList.remove('selecionado-lixo');
                    jogoAlvoParaLixo = jogo;
                    jogoDiv.classList.add('selecionado-lixo');
                }
                validarPegadaProposta();
            };
        } else if (turno === jogadorId && comprou) {
            jogoDiv.style.cursor = "pointer";
            jogoDiv.onclick = () => adicionarCartaAoJogo(jogo, jogadorId);
        }

        // Lógica visual para o status do jogo (limpo/sujo)
        const jogoEhLimpo = verificarLimpezaDoJogo(jogo);
        if (jogo.length >= 7) {
            jogoDiv.classList.add(jogoEhLimpo ? 'canastra-limpa' : 'canastra-suja');
        }

        // Desenha cada carta individualmente
        jogo.forEach(carta => {
            const cartaDiv = document.createElement('div');
            cartaDiv.className = 'jogo-carta';
            
            if (carta === 'Curinga') {
                cartaDiv.classList.add('curinga-verdadeiro');
            } else if (valorCarta(carta) === '2') {
                if (!isDoisNaturalNesteJogo(carta, jogo)) {
                    cartaDiv.classList.add('curinga');
                }
            }
            
            if (carta !== 'Curinga') {
                const naipe = naipeCarta(carta);
                if (naipe === '♥') cartaDiv.style.color = '#e74c3c';
                else if (naipe === '♣') cartaDiv.style.color = '#27ae60';
                else if (naipe === '♠') cartaDiv.style.color = '#34495e';
                else if (naipe === '♦') cartaDiv.style.color = '#f39c12';
            }
            
            cartaDiv.textContent = carta;
            jogoDiv.appendChild(cartaDiv);
        });

        container.appendChild(jogoDiv);
    });
}
function isPerfectSequence(cards) {
    if (cards.length < 2) return true;

    let indices = cards.map(c => valores.indexOf(valorCarta(c)));
    
    if (indices.includes(0) && indices.some(i => i >= 10)) {
        const aIndex = indices.indexOf(0);
        indices.splice(aIndex, 1);
        indices.push(13);
    }
    indices.sort((a, b) => a - b);

    for (let i = 0; i < indices.length - 1; i++) {
        if (indices[i+1] - indices[i] !== 1) {
            return false;
        }
    }
    return true;
}
function isDoisNaturalNesteJogo(cartaDois, jogoCompleto) {
    // Se a carta não for um '2', não é natural nesse contexto.
    if (valorCarta(cartaDois) !== '2') return false;

    // Isola as cartas naturais do jogo, excluindo TODOS os coringas e outros '2s'.
    const naturais = jogoCompleto.filter(c => c !== 'Curinga' && valorCarta(c) !== '2');
    
    // Se não há outras cartas naturais, não há naipe base para comparar.
    if (naturais.length === 0) return false;

    // O '2' precisa ser do mesmo naipe que o resto do jogo.
    const naipeBase = naipeCarta(naturais[0]);
    if (naipeCarta(cartaDois) !== naipeBase) {
        return false;
    }

    // A verificação final: as cartas naturais + este '2' formam uma sequência perfeita, sem buracos?
    // Se sim, significa que o '2' está em sua posição de origem.
    return isPerfectSequence([...naturais, cartaDois]);
}




function getCombinations(array, length) { let result = []; function f(prefix, arr) { if (prefix.length === length) { result.push(prefix); return; } for (let i = 0; i < arr.length; i++) { f(prefix.concat(arr[i]), arr.slice(i + 1)); } } f([], array); return result; }

// --- IA ESTRATÉGICA STBL ---
function jogadaIA() {
    infoTurno.textContent = `Máquina está pensando...`;
    
    // 1. A IA primeiro tenta adicionar cartas da mão a jogos existentes (jogada segura)
    iaAdicionaCartasEmJogos();

    // 2. LÓGICA DE DECISÃO ESTRATÉGICA SOBRE O LIXO
    let pegouDoLixo = false;
    const cartaDoTopo = descarte.length > 0 ? descarte[descarte.length - 1] : null;

    if (cartaDoTopo) {
        const possiveisPegadas = [];

        // A. Avalia CADA jogada possível adicionando a jogos existentes
        for (const jogo of baixados2) {
            if (podeAdicionarCartaAoJogo(cartaDoTopo, jogo)) {
                let score = descarte.length * 10; // Benefício base do volume do lixo
                const jogoOriginalEraLimpo = verificarLimpezaDoJogo(jogo);
                const novoJogoProposto = [...jogo, cartaDoTopo];
                const novoJogoSeraLimpo = verificarLimpezaDoJogo(novoJogoProposto);

                if (!jogoOriginalEraLimpo && novoJogoSeraLimpo) score += 150; // BÔNUS MÁXIMO: Limpou um jogo!
                else if (jogoOriginalEraLimpo && novoJogoSeraLimpo) score += 100; // BÔNUS ALTO: Manteve um jogo importante limpo
                else if (!jogoOriginalEraLimpo && !novoJogoSeraLimpo) score += 20; // Bônus baixo por aumentar um jogo já sujo
                else if (jogoOriginalEraLimpo && !novoJogoSeraLimpo) score -= 100; // PENALIDADE: Sujou um jogo que era limpo!
                
                if (novoJogoProposto.length >= 7) score += 80; // Bônus por fechar ou aumentar uma canastra

                possiveisPegadas.push({ tipo: 'EXISTENTE', jogoAlvo: jogo, score: score });
            }
        }

        // B. Avalia CADA jogada possível criando um novo jogo
        const combinacoes = getCombinations(jogador2, 2);
        for (const combo of combinacoes) {
            const novoJogoProposto = [cartaDoTopo, ...combo];
            if (formaJogo(novoJogoProposto)) {
                let score = descarte.length * 10;
                if (verificarLimpezaDoJogo(novoJogoProposto)) {
                    score += 50; // Bônus por criar um jogo que já nasce limpo
                }
                possiveisPegadas.push({ tipo: 'NOVO', jogoBase: combo, score: score });
                break; 
            }
        }
        
        // C. Decide qual a MELHOR jogada entre todas as opções
        if (possiveisPegadas.length > 0) {
            possiveisPegadas.sort((a, b) => b.score - a.score);
            const melhorJogada = possiveisPegadas[0];

            // Só pega o lixo se a MELHOR jogada possível for boa o suficiente
            if (melhorJogada.score > 40) {
                pegouDoLixo = true;
                // Executa a melhor jogada encontrada
                if (melhorJogada.tipo === 'EXISTENTE') {
                    descarte.pop();
                    jogador2.push(...descarte);
                    descarte.length = 0;
                    melhorJogada.jogoAlvo.push(cartaDoTopo);
                    calcularPontosDaJogada([cartaDoTopo], 2);
                } else if (melhorJogada.tipo === 'NOVO') {
                    const novoJogo = [cartaDoTopo, ...melhorJogada.jogoBase];
                    descarte.pop();
                    jogador2.push(...descarte);
                    descarte.length = 0;
                    novoJogo.forEach(c => jogador2.splice(jogador2.indexOf(c), 1));
                    baixados2.push(novoJogo);
                    calcularPontosDaJogada(novoJogo, 2);
                }
            }
        }
    }

    // 3. Se não pegou o lixo, compra do monte
    if (!pegouDoLixo) {
        if (baralho.length === 0 && !tentarReabastecerMonte()) {
            fimDoJogoPorFaltaDeCartas();
            return;
        }
        jogador2.push(baralho.pop());
    }

    // 4. Lógica final de baixar jogos e descartar
    iaTentaBaixarTudoComEstrategia();
    iaAdicionaCartasEmJogos();
    const cartaParaDescartar = iaDecideDescarteEstrategico();

    if (cartaParaDescartar && jogador2.includes(cartaParaDescartar)) {
        jogador2.splice(jogador2.indexOf(cartaParaDescartar), 1);
        descarte.push(cartaParaDescartar);
    } else if (jogador2.length > 0) {
        descarte.push(jogador2.pop());
    }

    if (jogador2.length === 0) {
        if (pegouMorto2) {
            if (temCanastraLimpa(baixados2)) { fimDoJogo(2); return; }
            else {
                const cartaDevolvida = descarte.pop();
                jogador2.push(cartaDevolvida);
                if (baralho.length > 0) {
                    jogador2.push(baralho.pop());
                } else if(tentarReabastecerMonte()){
                    jogador2.push(baralho.pop());
                }
                const novaCartaDescarte = iaDecideDescarteEstrategico();
                if (novaCartaDescarte && jogador2.includes(novaCartaDescarte)) {
                    jogador2.splice(jogador2.indexOf(novaCartaDescarte), 1);
                    descarte.push(novaCartaDescarte);
                } else if (jogador2.length > 0) { descarte.push(jogador2.pop()); }
            }
        } else {
            jogador2.push(...morto2); pegouMorto2 = true; morto2 = [];
            alert(`A Máquina pegou o morto!`);
            setTimeout(jogadaIA, 1000); return;
        }
    }
    proximoTurno();
}

function iaTentaBaixarTudoComEstrategia() {
    let baixouAlgo = true;
    while(baixouAlgo) {
        baixouAlgo = false;
        const jaTemLimpa = temCanastraLimpa(baixados2);
        const todosOsJogosPossiveis = encontrarTodosOsJogosNaMao(jogador2);
        if (todosOsJogosPossiveis.length === 0) break;
        todosOsJogosPossiveis.forEach(j => { j.score = avaliarQualidadeDoJogo(j, jaTemLimpa, jogador2); });
        todosOsJogosPossiveis.sort((a, b) => b.score - a.score);
        const melhorJogo = todosOsJogosPossiveis[0];
        if (melhorJogo.score > 25) { 
            baixados2.push(melhorJogo); 
            calcularPontosDaJogada(melhorJogo, 2);
            jogador2 = jogador2.filter(c => !melhorJogo.includes(c));
            baixouAlgo = true;
        }
    }
}

function encontrarTodosOsJogosNaMao(mao) {
    const jogosEncontrados = [];
    if(mao.length < 3) return [];

    // LIMITE DE SEGURANÇA OTIMIZADO:
    // Garante que a IA pense rápido e nunca trave o jogo.
    const LIMITE_DE_COMBINACOES = 2500; 

    for (let i = Math.min(mao.length, 7); i >= 3; i--) {
        const combinacoes = getCombinations(mao, i);

        // Se o número de combinações for gigantesco, o código só testa uma parte delas.
        const combinacoesParaTestar = combinacoes.length > LIMITE_DE_COMBINACOES 
            ? combinacoes.slice(0, LIMITE_DE_COMBINACOES) 
            : combinacoes;

        for (const combo of combinacoesParaTestar) {
            if (formaJogo(combo)) {
                // Evita adicionar um jogo menor que já faz parte de um jogo maior encontrado
                if (!jogosEncontrados.some(j => combo.every(c => j.includes(c)))) {
                    jogosEncontrados.push(combo);
                }
            }
        }
    }
    return jogosEncontrados;
}
function avaliarQualidadeDoJogo(jogo, jaTemLimpa, maoCompleta) {
    let score = 0;
    score += jogo.length * 10; // Bônus base pelo tamanho do jogo

    const jogoEhLimpo = verificarLimpezaDoJogo(jogo);

    if (jogoEhLimpo) {
        score += 50;
        if (jogo.length >= 6) {
            score += 100;
        }
    } else { // O jogo é sujo.
        // --- INÍCIO DA NOVA LÓGICA DE EFICIÊNCIA ---
        const coringasNoJogo = jogo.filter(c => valorCarta(c) === '2' || c === 'Curinga');
        const naturaisNoJogo = jogo.filter(c => !coringasNoJogo.includes(c));

        // PENALIDADE MÁXIMA: Desperdício de Coringa
        // Se, ao remover os coringas, as cartas naturais que sobram AINDA formam um jogo válido,
        // significa que o uso do coringa foi completamente desnecessário.
        if (naturaisNoJogo.length >= 3 && formaJogo(naturaisNoJogo)) {
            score -= 200; // Penalidade altíssima por desperdiçar um coringa.
        }
        // --- FIM DA NOVA LÓGICA DE EFICIÊNCIA ---
        else { // O coringa era necessário, então aplicamos as penalidades normais.
            const temCuringaVerdadeiro = jogo.some(c => c === 'Curinga');
            
            if (temCuringaVerdadeiro) {
                let penalidadeCuringa = 100;
                if (jaTemLimpa) { penalidadeCuringa -= 70; }
                else if (baralho.length < 15) { penalidadeCuringa -= 50; }
                if (jogo.length >= 7) { penalidadeCuringa -= 40; }
                score -= penalidadeCuringa;
            }

            const naipeBase = naturaisNoJogo.length > 0 ? naipeCarta(naturaisNoJogo[0]) : '';
            const doisDoNaipeFoiUsadoComoCuringa = jogo.some(c => 
                valorCarta(c) === '2' && naipeCarta(c) === naipeBase
            );
            if (doisDoNaipeFoiUsadoComoCuringa) { score -= 75; }
            if (!jaTemLimpa) { score -= 50; }
        }
    }

    // Lógica de Paciência (já existente)
    const naturaisDoJogo = jogo.filter(c => valorCarta(c) !== '2' && c !== 'Curinga');
    if (naturaisDoJogo.length > 0) {
        const naipeDoJogo = naipeCarta(naturaisDoJogo[0]);
        const contagemNaipeNaMao = maoCompleta.filter(c => c !== 'Curinga' && naipeCarta(c) === naipeDoJogo).length;

        if (contagemNaipeNaMao >= 5 && jogo.length < 5 && baralho.length > 20) {
            score -= 60; // Penalidade por "impaciência"
        }
    }

    return score;
}
function iaAdicionaCartasEmJogos() {
    let melhorAdicao = null;

    // 1. Encontra e pontua TODAS as adições possíveis
    for (const carta of jogador2) {
        for (const jogo of baixados2) {
            if (podeAdicionarCartaAoJogo(carta, jogo)) {
                let score = 0;
                const jogoOriginalEraLimpo = verificarLimpezaDoJogo(jogo);
                const novoJogoProposto = [...jogo, carta];
                const novoJogoSeraLimpo = verificarLimpezaDoJogo(novoJogoProposto);

                // Aplica a mesma lógica de pontuação estratégica
                if (!jogoOriginalEraLimpo && novoJogoSeraLimpo) score += 200; // Limpou um jogo!
                else if (jogoOriginalEraLimpo && novoJogoSeraLimpo) score += 100; // Manteve limpo
                else if (!jogoOriginalEraLimpo && !novoJogoSeraLimpo) score += 50; // Aumentou sujo
                else if (jogoOriginalEraLimpo && !novoJogoSeraLimpo) score -= 150; // PENALIDADE MÁXIMA por sujar um jogo limpo

                if (novoJogoProposto.length >= 7) score += 50; // Bônus por fazer canastra

                // Guarda a melhor jogada encontrada até agora
                if (!melhorAdicao || score > melhorAdicao.score) {
                    melhorAdicao = { carta: carta, jogoAlvo: jogo, score: score };
                }
            }
        }
    }

    // 2. Executa APENAS a melhor jogada, e somente se ela for boa (score > 0)
    if (melhorAdicao && melhorAdicao.score > 0) {
        const { carta, jogoAlvo } = melhorAdicao;
        const index = jogador2.indexOf(carta);
        if (index > -1) {
            jogador2.splice(index, 1);
            jogoAlvo.push(carta);
            calcularPontosDaJogada([carta], 2);
        }
    }
}
function iaEncontraJogoParaAdicionar(carta) {
    const possiveisJogadas = [];

    // 1. Encontra TODAS as jogadas possíveis e calcula um score para cada uma.
    for (const jogo of baixados2) {
        if (podeAdicionarCartaAoJogo(carta, jogo)) {
            let score = 0;
            const jogoOriginalEraLimpo = verificarLimpezaDoJogo(jogo);
            const novoJogoProposto = [...jogo, carta];
            const novoJogoSeraLimpo = verificarLimpezaDoJogo(novoJogoProposto);

            // CENÁRIO 1: Jogada EXCELENTE - Limpando um jogo que estava sujo.
            if (!jogoOriginalEraLimpo && novoJogoSeraLimpo) {
                score += 200;
            } 
            // CENÁRIO 2: Jogada ÓTIMA - Mantendo um jogo limpo.
            else if (jogoOriginalEraLimpo && novoJogoSeraLimpo) {
                score += 100;
            } 
            // CENÁRIO 3: Jogada OK - Aumentando um jogo que já era sujo.
            else if (!jogoOriginalEraLimpo && !novoJogoSeraLimpo) {
                score += 50;
            } 
            // CENÁRIO 4: Jogada RUIM - Sujando um jogo que era limpo.
            else if (jogoOriginalEraLimpo && !novoJogoSeraLimpo) {
                score -= 100; // Penalidade por estragar um jogo limpo.
            }

            // Bônus extra por completar uma canastra.
            if (novoJogoProposto.length >= 7) {
                score += 50;
            }

            possiveisJogadas.push({ jogo: jogo, score: score });
        }
    }

    // 2. Se não encontrou nenhuma jogada, retorna nulo.
    if (possiveisJogadas.length === 0) {
        return null;
    }

    // 3. Ordena as jogadas da melhor para a pior.
    possiveisJogadas.sort((a, b) => b.score - a.score);

    // 4. Retorna o melhor jogo encontrado.
    return possiveisJogadas[0].jogo;
}

function iaEncontraJogoComDescarte(carta) {
    const mao = jogador2;
    for (let i = mao.length - 1; i >= 2; i--) {
        const combinacoes = getCombinations(mao, i);
        for (const combo of combinacoes) {
            const jogoProposto = [...combo, carta];
            if (formaJogo(jogoProposto)) { return jogoProposto; }
        }
    }
    return null;
}
function avaliarQualidadeDoLixo(lixo, mao, jogosBaixados) {
    let score = 0;
    const cartaDoTopo = lixo[lixo.length - 1];

    // 1. Bônus base pelo Tamanho (reduzido para dar mais peso à qualidade).
   score += lixo.length * 10; // AUMENTADO SIGNIFICATIVAMENTE

    // 2. ANÁLISE DE QUALIDADE ao adicionar a um jogo existente na mesa.
    for (const jogo of jogosBaixados) {
        if (podeAdicionarCartaAoJogo(cartaDoTopo, jogo)) {
            const jogoOriginalEraLimpo = verificarLimpezaDoJogo(jogo);
            const novoJogoProposto = [...jogo, cartaDoTopo];
            const novoJogoSeraLimpo = verificarLimpezaDoJogo(novoJogoProposto);

            // BÔNUS MÁXIMO: A jogada "limpa" um jogo que estava sujo!
            if (!jogoOriginalEraLimpo && novoJogoSeraLimpo) {
                score += 150;
            }
            
            // BÔNUS GRANDE: A jogada completa uma canastra.
            if (jogo.length >= 6) { // Transforma em canastra ou aumenta uma já existente
                score += 100;
                if (novoJogoSeraLimpo) {
                    score += 50; // Bônus extra se a canastra for/continuar limpa.
                }
            }

            // Bônus normal por apenas adicionar uma carta a um jogo.
            score += 20;
        }
    }

    // 3. ANÁLISE DE QUALIDADE ao formar um novo jogo com as cartas da mão.
    const combinacoes = getCombinations(mao, 2);
    for (const combo of combinacoes) {
        const novoJogoProposto = [cartaDoTopo, ...combo];
        if (formaJogo(novoJogoProposto)) {
            // Bônus por criar um novo jogo.
            score += 15;
            // Bônus EXTRA se o novo jogo já nascer limpo!
            if (verificarLimpezaDoJogo(novoJogoProposto)) {
                score += 40;
            }
            break; // Apenas uma combinação é suficiente para a análise.
        }
    }
    
    return score;
}

function iaDecideDescarteEstrategico() {
    const scores = {};
    const maoDaIA = [...jogador2];

    for (const carta of maoDaIA) {
        let score = 100; // Score base (quanto maior, mais "descartável")

        // Penalidade por ser coringa (nunca descarte se puder evitar)
        if (valorCarta(carta) === '2' || carta === 'Curinga') {
            score -= 200;
        }

        // Penalidade por fazer parte de um jogo potencial na mão
        const outrasCartas = maoDaIA.filter(c => c !== carta);
        if (outrasCartas.length >= 2) {
            const combinacoes = getCombinations(outrasCartas, 2);
            for (const combo of combinacoes) {
                if (formaJogo([carta, ...combo])) {
                    score -= 50; // Penalidade por quebrar um jogo em potencial
                    break;
                }
            }
        }

        // Penalidade por ser uma carta "perigosa" (próxima ao que o jogador quer, baseado na memória)
        for (const cartaMemorizada of memoriaDescarteIA) {
            if (naipeCarta(carta) === naipeCarta(cartaMemorizada)) {
                const diff = Math.abs(valores.indexOf(valorCarta(carta)) - valores.indexOf(valorCarta(cartaMemorizada)));
                if (diff > 0 && diff <= 2) {
                    score -= 80; // Penalidade alta por ser uma carta perigosa
                }
            }
        }

        // --- INÍCIO DA NOVA LÓGICA DEFENSIVA ---
        // PENALIDADE por servir em um jogo do oponente que já está na mesa
        for (const jogoOponente of baixados1) {
            if (podeAdicionarCartaAoJogo(carta, jogoOponente)) {
                score -= 100; // Penalidade alta por ajudar o oponente diretamente
                break; // Se serve em um jogo, já é perigosa, não precisa checar os outros
            }
        }
        // --- FIM DA NOVA LÓGICA DEFENSIVA ---

        scores[carta] = score;
    }

    // Encontra a carta com o maior score (a mais segura para descartar)
    let melhorCartaParaDescartar = null;
    let maiorScore = -Infinity;
    for (const carta in scores) {
        if (scores[carta] > maiorScore) {
            maiorScore = scores[carta];
            melhorCartaParaDescartar = carta;
        }
    }
    
    return melhorCartaParaDescartar;
}

