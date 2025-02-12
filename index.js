// Função para adicionar uma aposta
function adicionarAposta() {
    let site = document.getElementById('site').value;
    let odd = parseFloat(document.getElementById('odd').value);
    let valor = parseFloat(document.getElementById('valor').value);
    let descricao = document.getElementById('descricao').value;
    let data = document.getElementById('data').value || ''; // A data agora é opcional
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
}

// Função para adicionar uma linha na tabela
function adicionarLinhaTabela(aposta) {
    let tabela = document.getElementById('tabelaApostas');
    let linha = tabela.insertRow();

    let statusButton = `<button onclick="editarStatus(this)">Editar Status</button>`;

    // Exibir a data sem as horas, ou exibir uma célula vazia se a data não estiver presente
    let dataFormatada = aposta.data ? formatarData(aposta.data) : 'Não definida';

    linha.innerHTML = `
        <td><a href="${aposta.site}" target="_blank" class="hidden-link">${aposta.nomeSite}</a></td>
        <td>${aposta.odd.toFixed(2)}</td>
        <td>R$ ${aposta.valor.toFixed(2)}</td>
        <td>R$ ${aposta.lucro.toFixed(2)}</td>
        <td>${aposta.descricao}</td>
        <td><span class="status">${aposta.status}</span></td>
        <td class="data-td">${dataFormatada}</td> <!-- Exibe a data formatada ou 'Não definida' -->
        <td>
            ${statusButton}
            <button onclick="removerAposta(this)">Remover</button>
        </td>
    `;
}

// Função para formatar a data no formato dd/mm/aaaa
function formatarData(data) {
    const [dia, mes, ano] = data.split('/');  // Divide a data no formato dd/mm/aaaa
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
    linha.parentNode.removeChild(linha);

    // Remover a aposta do localStorage
    let site = linha.cells[0].innerText;
    let apostasSalvas = JSON.parse(localStorage.getItem('apostas')) || [];
    apostasSalvas = apostasSalvas.filter(aposta => aposta.site !== site);
    localStorage.setItem('apostas', JSON.stringify(apostasSalvas));
}

// Função para carregar as apostas do localStorage quando a página é carregada
window.onload = function() {
    let apostasSalvas = JSON.parse(localStorage.getItem('apostas')) || [];
    apostasSalvas.forEach(adicionarLinhaTabela);
}
