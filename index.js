document.addEventListener("DOMContentLoaded", function () {
    const dataInput = document.getElementById('data');

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

    
    window.adicionarAposta = function() {
        let site = document.getElementById('site').value;
        let odd = parseFloat(document.getElementById('odd').value);
        let valor = parseFloat(document.getElementById('valor').value);
        let descricao = document.getElementById('descricao').value;
        let data = document.getElementById('data').value || ''; 
        let lucro = (odd * valor) - valor;

        let nomeSite = site.length > 20 ? site.substring(0, 20) + "..." : site;

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

        
        adicionarLinhaTabela(aposta);

        
        let apostasSalvas = JSON.parse(localStorage.getItem('apostas')) || [];
        apostasSalvas.push(aposta);
        localStorage.setItem('apostas', JSON.stringify(apostasSalvas));

        
        document.getElementById('apostaForm').reset();

       
        carregarApostas();
    }

    
    function adicionarLinhaTabela(aposta) {
        let tabela = document.getElementById('tabelaApostas');
        let linha = tabela.insertRow();
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

    
    function carregarApostas() {
        let apostasSalvas = JSON.parse(localStorage.getItem('apostas')) || [];
        let tabela = document.getElementById('tabelaApostas');
        tabela.innerHTML = ""; 

        apostasSalvas.forEach(adicionarLinhaTabela);

        
        calcularTotalLucro();
    }

   
    function formatarData(data) {
        if (!data || !data.includes('/')) return 'Não definida';

        let partes = data.split('/');
        if (partes.length < 2) return 'Não definida';

        let dia = partes[0].padStart(2, '0');
        let mes = partes[1].padStart(2, '0');
        let ano = partes[2] ? partes[2] : new Date().getFullYear();

        return `${dia}/${mes}/${ano}`;
    }

    
    window.editarStatus = function(id) {
        let apostasSalvas = JSON.parse(localStorage.getItem('apostas')) || [];
        let aposta = apostasSalvas.find(aposta => aposta.id === id);

        if (!aposta) return;

        let novoStatus = prompt('Informe o novo status da aposta: (Green / Red / Em andamento)', aposta.status);

        if (novoStatus === null || novoStatus === '') {
            return; 
        }

        aposta.status = novoStatus;
        localStorage.setItem('apostas', JSON.stringify(apostasSalvas));
        carregarApostas();
    }

    
    window.removerAposta = function(id) {
        let apostasSalvas = JSON.parse(localStorage.getItem('apostas')) || [];
        apostasSalvas = apostasSalvas.filter(aposta => aposta.id !== id);
        localStorage.setItem('apostas', JSON.stringify(apostasSalvas));
        carregarApostas();
    }

   
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
                return total + aposta.lucro;
            } else if (aposta.status.toLowerCase() === 'red') {
                return total - aposta.valor;
            }
            return total;
        }, 0);
        document.getElementById('totalLucro').textContent = totalLucro.toFixed(2);
    }

    
    new Sortable(document.getElementById('tabelaApostas'), {
        animation: 150,
        onEnd: function (evt) {
            let apostasSalvas = JSON.parse(localStorage.getItem('apostas')) || [];
            let novaOrdem = [];
            let linhas = evt.from.children;

            for (let i = 0; i < linhas.length; i++) {
                let id = parseInt(linhas[i].getAttribute('data-id'));
                let aposta = apostasSalvas.find(aposta => aposta.id === id);
                novaOrdem.push(aposta);
            }

            localStorage.setItem('apostas', JSON.stringify(novaOrdem));
            carregarApostas();
        }
    });

    
    window.onload = carregarApostas;
});