// Função para adicionar uma aposta
function adicionarAposta() {
    let site = document.getElementById('site').value;
    let odd = parseFloat(document.getElementById('odd').value);
    let valor = parseFloat(document.getElementById('valor').value);
    let descricao = document.getElementById('descricao').value;
    let data = document.getElementById('data').value || ''; 
    let lucro = (odd * valor) - valor;

    let nomeSite = site.length > 20 ? site.substring(0, 20) + "..." : site;

    let aposta = {
        site: site,
        nomeSite: nomeSite,
        odd: odd,
        valor: valor,
        lucro: lucro,
        descricao: descricao,
        status: 'Em andamento',
        data: data
    };

    // Adicionar aposta à tabela
    adicionarLinhaTabela(aposta);

    // Salvar a aposta no localStorage
    let apostasSalvas = JSON.parse(localStorage.getItem('apostas')) || [];
    apostasSalvas.push(aposta);
    localStorage.setItem('apostas', JSON.stringify(apostasSalvas));

    // Limpar o formulário
    document.getElementById('apostaForm').reset();

    // Recarregar as apostas da tabela
    carregarApostas();
}

// Função para adicionar uma linha na tabela
function adicionarLinhaTabela(aposta) {
    let tabela = document.getElementById('tabelaApostas');
    let linha = tabela.insertRow();

    let statusButton = `<button onclick="editarStatus(this)">Editar Status</button>`;

    // Se algum valor for nulo, defina um valor padrão
    let odd = aposta.odd ? aposta.odd.toFixed(2) : 'N/A';
    let valor = aposta.valor ? aposta.valor.toFixed(2) : 'N/A';
    let lucro = aposta.lucro ? aposta.lucro.toFixed(2) : 'N/A';
    let descricao = aposta.descricao || 'Sem descrição';
    let dataFormatada = aposta.data ? /*formatarData?*/(aposta.data) : 'Não definida';

    linha.innerHTML = `
        <td><a href="${aposta.site}" target="_blank" class="hidden-link">${aposta.nomeSite}</a></td>
        <td>${odd}</td>
        <td>R$ ${valor}</td>
        <td>R$ ${lucro}</td>
        <td>${descricao}</td>
        <td><span class="status">${aposta.status}</span></td>
        <td class="data-td">${dataFormatada}</td>
        <td>
            ${statusButton}
            <button onclick="removerAposta(this)">Remover</button>
        </td>
    `;
}

// Função para carregar as apostas salvas no localStorage ao abrir a página
function carregarApostas() {
    let apostasSalvas = JSON.parse(localStorage.getItem('apostas')) || [];
    let tabela = document.getElementById('tabelaApostas');
    tabela.innerHTML = ""; // Limpa a tabela antes de adicionar as apostas

    apostasSalvas.forEach(adicionarLinhaTabela);
}

// Função para formatar a data no formato dd/mm/aaaa
function formatarData(data) {
    if (!data || !data.includes('/')) return 'Não definida';

    let partes = data.split('/');
    if (partes.length !== 3) return 'Não definida';

    let [dia, mes, ano] = partes;
    return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
}

// Função para editar o status da aposta
function editarStatus(botao) {
    let linha = botao.parentNode.parentNode;
    let statusCell = linha.cells[5]; // A célula do status
    let apostaIndex = linha.rowIndex - 1;

    // Obter status atual
    let currentStatus = statusCell.innerText;

    // Escolher o novo status
    let novoStatus = prompt('Informe o novo status da aposta: (Green / Red / Em andamento)', currentStatus);

    if (novoStatus === null || novoStatus === '') {
        return; // Se o usuário cancelar ou não preencher, não faz nada
    }

    // Atualizar o status na tabela
    statusCell.innerHTML = novoStatus;

    // Atualizar o status no localStorage
    let apostasSalvas = JSON.parse(localStorage.getItem('apostas')) || [];
    apostasSalvas[apostaIndex].status = novoStatus;
    localStorage.setItem('apostas', JSON.stringify(apostasSalvas));
}

// Função para remover uma aposta
function removerAposta(botao) {
    let linha = botao.parentNode.parentNode;
    let site = linha.cells[0].innerText;

    // Remover a aposta do localStorage
    let apostasSalvas = JSON.parse(localStorage.getItem('apostas')) || [];
    apostasSalvas = apostasSalvas.filter(aposta => aposta.nomeSite !== site);
    localStorage.setItem('apostas', JSON.stringify(apostasSalvas));

    // Remover linha da tabela
    linha.remove();
}

// Carregar apostas ao carregar a página
window.onload = carregarApostas;
