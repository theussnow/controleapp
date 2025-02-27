document.addEventListener("DOMContentLoaded", function () {
    
    let editMode = false;
    let organizeMode = false;
    let currentPage = 1;
    const itemsPerPage = 10;

   
    const dataInput = document.getElementById('data');
    const toggleEditModeBtn = document.getElementById('toggleEditMode');
    const editModeDescription = document.getElementById('editModeDescription');
    const toggleOrganizeModeBtn = document.getElementById('toggleOrganizeMode');
    const organizeModeDescription = document.getElementById('organizeModeDescription');
    const toggleDarkModeBtn = document.getElementById('toggleDarkMode');
    const tabelaApostas = document.getElementById('tabelaApostas');

    
    if (!toggleOrganizeModeBtn || !organizeModeDescription) {
        console.error('Elementos não encontrados: toggleOrganizeMode ou organizeModeDescription');
        return;
    }

    
    function migrarDados() {
        let apostasSalvas = JSON.parse(localStorage.getItem('apostas')) || [];
        let dadosMigrados = apostasSalvas.map(aposta => {
            if (!aposta.hasOwnProperty('nomeSite')) {
                aposta.nomeSite = aposta.site.length > 20 ? aposta.site.substring(0, 20) + "..." : aposta.site;
            }
            return aposta;
        });
        localStorage.setItem('apostas', JSON.stringify(dadosMigrados));
    }

    
    const sortable = new Sortable(tabelaApostas, {
        animation: 150,
        disabled: true,
        onEnd: function (evt) {
            if (organizeMode) {
                let apostasSalvas = JSON.parse(localStorage.getItem('apostas')) || [];
                let novaOrdemPagina = [];
                let linhas = evt.from.children;

                
                for (let i = 0; i < linhas.length; i++) {
                    let id = parseInt(linhas[i].getAttribute('data-id'));
                    let aposta = apostasSalvas.find(aposta => aposta.id === id);
                    if (aposta) novaOrdemPagina.push(aposta);
                }

               
                let inicio = (currentPage - 1) * itemsPerPage;
                let fim = Math.min(inicio + itemsPerPage, apostasSalvas.length);

                
                let apostasAntes = apostasSalvas.slice(0, inicio);
                let apostasDepois = apostasSalvas.slice(fim);

                
                let novaOrdemCompleta = [...apostasAntes, ...novaOrdemPagina, ...apostasDepois];

                
                localStorage.setItem('apostas', JSON.stringify(novaOrdemCompleta));
                carregarApostas(currentPage);
            }
        }
    });

    
    window.toggleEditMode = function() {
        editMode = !editMode;
        organizeMode = false;
        toggleEditModeBtn.textContent = editMode ? 'Desativar Edição' : 'Modo de Edição';
        editModeDescription.textContent = editMode ? 'Clique para desativar o modo de edição' : 'Clique para ativar o modo de edição (remover ou alterar status)';
        toggleOrganizeModeBtn.textContent = 'Modo de Organização';
        organizeModeDescription.textContent = 'Clique para ativar o modo de organização (segure e arraste)';
        tabelaApostas.classList.toggle('edit-mode', editMode);
        tabelaApostas.classList.remove('organize-mode');
        sortable.option("disabled", true);
        console.log('Modo de edição:', editMode, 'Sortable disabled:', sortable.options.disabled);
    };

    window.toggleOrganizeMode = function() {
        organizeMode = !organizeMode;
        editMode = false;
        toggleOrganizeModeBtn.textContent = organizeMode ? 'Desativar Organização' : 'Modo de Organização';
        organizeModeDescription.textContent = organizeMode ? 'Clique para desativar o modo de organização' : 'Clique para ativar o modo de organização (segure e arraste)';
        toggleEditModeBtn.textContent = 'Modo de Edição';
        editModeDescription.textContent = 'Clique para ativar o modo de edição (remover ou alterar status)';
        tabelaApostas.classList.toggle('organize-mode', organizeMode);
        tabelaApostas.classList.remove('edit-mode');
        sortable.option("disabled", !organizeMode);
        console.log('Modo de organização:', organizeMode, 'Sortable disabled:', sortable.options.disabled);
    };

    window.toggleDarkMode = function() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        toggleDarkModeBtn.textContent = isDarkMode ? 'Modo Claro' : 'Modo Escuro';
    };

    
    dataInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, ''); 
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        if (value.length >= 5) {
            value = value.slice(0, 5) + '/' + value.slice(5, 9);
        }
        e.target.value = value;
    });

    const darkModePreference = localStorage.getItem('darkMode') === 'true';
    if (darkModePreference) {
        document.body.classList.add('dark-mode');
        toggleDarkModeBtn.textContent = 'Modo Claro';
    }

    window.adicionarAposta = function() {
        let site = document.getElementById('site').value || '';
        let odd = parseFloat(document.getElementById('odd').value) || 0;
        let valor = parseFloat(document.getElementById('valor').value) || 0;
        let descricao = document.getElementById('descricao').value || '';
        let dataInput = document.getElementById('data').value || ''; 
        let lucro = (odd * valor) - valor;

        let nomeSite = site.length > 20 ? site.substring(0, 20) + "..." : site;
        let data = formatarData(dataInput); 

        let aposta = {
            id: Date.now(), 
            site: site,
            nomeSite: nomeSite,
            odd: odd,
            valor: valor,
            lucro: lucro,
            descricao: descricao,
            status: 'Em andamento',
            data: data
        };

        let apostasSalvas = JSON.parse(localStorage.getItem('apostas')) || [];
        apostasSalvas.push(aposta);
        localStorage.setItem('apostas', JSON.stringify(apostasSalvas));

        document.getElementById('apostaForm').reset();
        carregarApostas(currentPage);
    };

    function adicionarLinhaTabela(aposta) {
        let linha = tabelaApostas.insertRow();
        linha.setAttribute('data-id', aposta.id);

        let statusButton = `<button onclick="editarStatus(${aposta.id})">Editar Status</button>`;

        let odd = aposta.odd ? aposta.odd.toFixed(2) : 'N/A';
        let valor = aposta.valor ? aposta.valor.toFixed(2) : 'N/A';
        let lucro = aposta.lucro ? aposta.lucro.toFixed(2) : 'N/A';
        let descricao = aposta.descricao || 'Sem descrição';
        let dataFormatada = aposta.data ? formatarData(aposta.data) : 'Não definida';

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
                <button onclick="removerAposta(${aposta.id})">Remover</button>
            </td>
        `;

        atualizarCorStatus(linha.cells[5], aposta.status);
    }

    function carregarApostas(pagina = 1) {
        currentPage = pagina;
        let apostasSalvas = JSON.parse(localStorage.getItem('apostas')) || [];
        tabelaApostas.innerHTML = ""; 

        let inicio = (pagina - 1) * itemsPerPage;
        let fim = inicio + itemsPerPage;
        let apostasPagina = apostasSalvas.slice(inicio, fim);

        apostasPagina.forEach(adicionarLinhaTabela);
        calcularTotalLucro();
        atualizarPaginacao(pagina, apostasSalvas.length);
    }

    function atualizarPaginacao(paginaAtual, totalApostas) {
        let totalPaginas = Math.ceil(totalApostas / itemsPerPage);
        let paginacao = document.getElementById('pagination');
        paginacao.innerHTML = "";

        for (let i = 1; i <= totalPaginas; i++) {
            let botao = document.createElement('button');
            botao.textContent = i;
            botao.className = 'page-button' + (i === paginaAtual ? ' active' : '');
            botao.onclick = function() {
                carregarApostas(i);
            };
            paginacao.appendChild(botao);
        }
    }

    function formatarData(data) {
        if (!data || !data.includes('/')) {
            const hoje = new Date();
            return `${hoje.getDate().toString().padStart(2, '0')}/${(hoje.getMonth() + 1).toString().padStart(2, '0')}/${hoje.getFullYear()}`;
        }

        let partes = data.split('/');
        if (partes.length < 3 || !partes[0] || !partes[1]) {
            return '01/01/2025'; 
        }

        let dia = partes[0].padStart(2, '0');
        let mes = partes[1].padStart(2, '0');
        let ano = partes[2] ? partes[2].padStart(4, '2025') : '2025'; 
        return `${dia}/${mes}/${ano}`;
    }

    window.editarStatus = function(id) {
        if (!editMode) {
            alert('Ative o modo de edição para alterar o status.');
            return;
        }
        let apostasSalvas = JSON.parse(localStorage.getItem('apostas')) || [];
        let aposta = apostasSalvas.find(aposta => aposta.id === id);

        if (!aposta) return;

        let novoStatus = prompt('Informe o novo status da aposta: (Green / Red / Em andamento)', aposta.status);

        if (novoStatus === null || novoStatus === '') {
            return; 
        }

        aposta.status = novoStatus;
        localStorage.setItem('apostas', JSON.stringify(apostasSalvas));
        carregarApostas(currentPage);
    };

    window.removerAposta = function(id) {
        if (!editMode) {
            alert('Ative o modo de edição para remover apostas.');
            return;
        }
        let apostasSalvas = JSON.parse(localStorage.getItem('apostas')) || [];
        apostasSalvas = apostasSalvas.filter(aposta => aposta.id !== id);
        localStorage.setItem('apostas', JSON.stringify(apostasSalvas));
        carregarApostas(currentPage);
    };

    function atualizarCorStatus(celula, status) {
        celula.classList.remove('status-green', 'status-red');
        if (status.toLowerCase() === 'green') {
            celula.classList.add('status-green');
        } else if (status.toLowerCase() === 'red') {
            celula.classList.add('status-red');
        }
    }

    function calcularTotalLucro() {
        let apostasSalvas = JSON.parse(localStorage.getItem('apostas')) || [];
        let totalLucro = apostasSalvas.reduce((total, aposta) => {
            if (aposta.status.toLowerCase() === 'green') {
                return total + (aposta.lucro || 0);
            } else if (aposta.status.toLowerCase() === 'red') {
                return total - (aposta.valor || 0);
            }
            return total; 
        }, 0);
        document.getElementById('totalLucro').textContent = totalLucro.toFixed(2);
    }
    
    migrarDados();
    carregarApostas(1);
});