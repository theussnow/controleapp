document.addEventListener("DOMContentLoaded", function () {
    
    const toggleDarkModeBtn = document.getElementById('toggleDarkMode');
    const lucroCanvas = document.getElementById('lucroChart');
    const progressaoCanvas = document.getElementById('progressaoChart');
    if (!lucroCanvas || !progressaoCanvas) {
        console.error('Canvas não encontrado:', { lucroCanvas, progressaoCanvas });
        return;
    }
    const lucroCtx = lucroCanvas.getContext('2d');
    const progressaoCtx = progressaoCanvas.getContext('2d');
    if (!lucroCtx || !progressaoCtx) {
        console.error('Contexto do canvas inválido:', { lucroCtx, progressaoCtx });
        return;
    }
    let lucroChart, progressaoChart; 
    const totalApostasEl = document.getElementById('totalApostas');
    const totalLucroEl = document.getElementById('totalLucro');
    const roiEl = document.getElementById('roi');
    const progressaoEl = document.getElementById('progressao');

    
    let periodoAtual = '1m'; 

    
    function ajustarResolucaoCanvas(canvas) {
        const scale = window.devicePixelRatio;
        canvas.width = canvas.offsetWidth * scale;
        canvas.height = canvas.offsetHeight * scale;
        canvas.getContext('2d').scale(scale, scale);
    }

    
    ajustarResolucaoCanvas(lucroCanvas);
    ajustarResolucaoCanvas(progressaoCanvas);

    
    function calcularDados() {
        const apostasSalvas = JSON.parse(localStorage.getItem('apostas')) || [];
        console.log('Apostas salvas do localStorage (raw):', apostasSalvas);

        const lucroPorData = {};
        let totalLucro = 0;
        let totalValorInvestido = 0;
        let numApostas = apostasSalvas.length;

        apostasSalvas.forEach(aposta => {
            if (!aposta || typeof aposta !== 'object') {
                console.warn('Aposta inválida:', aposta);
                return;
            }

            let dataStr = aposta.data || '';
            if (!dataStr || !dataStr.includes('/')) {
                console.warn('Data inválida ou ausente, usando data atual:', aposta);
                dataStr = new Date().toLocaleDateString('pt-BR');
            }

            let [dia, mes, ano] = dataStr.split('/').map(Number);
            if (!dia || !mes || !ano) {
                console.warn('Formato de data inválido, ignorando:', dataStr);
                return;
            }
            ano = ano < 100 ? 2000 + ano : ano;
            const data = new Date(ano, mes - 1, dia);
            const dataFormatada = data.toISOString().split('T')[0];

            if (isNaN(data.getTime())) {
                console.warn('Data inválida após conversão:', dataStr);
                return;
            }

            if (!lucroPorData[dataFormatada]) lucroPorData[dataFormatada] = 0;
            if (aposta.status && aposta.status.toLowerCase() === 'green') {
                lucroPorData[dataFormatada] += (aposta.lucro || 0);
                totalLucro += (aposta.lucro || 0);
            } else if (aposta.status && aposta.status.toLowerCase() === 'red') {
                lucroPorData[dataFormatada] -= (aposta.valor || 0);
                totalLucro -= (aposta.valor || 0);
            } else {
                lucroPorData[dataFormatada] += (aposta.lucro || 0);
                totalLucro += (aposta.lucro || 0);
            }
            totalValorInvestido += (aposta.valor || 0);
            console.log(`Data processada: ${dataFormatada}, Lucro: ${lucroPorData[dataFormatada]}`);
        });

        const datas = Object.keys(lucroPorData).map(d => new Date(d));
        const dataMaisAntiga = datas.length ? new Date(Math.min(...datas.map(d => d.getTime()))) : new Date();
        const dadosFiltrados = {};
        for (const dataStr in lucroPorData) {
            const data = new Date(dataStr);
            const diffDias = Math.floor((data - dataMaisAntiga) / (1000 * 60 * 60 * 24));
            switch (periodoAtual) {
                case '1d': if (diffDias >= 0 && diffDias <= 1) dadosFiltrados[dataStr] = lucroPorData[dataStr]; break;
                case '1s': if (diffDias >= 0 && diffDias <= 7) dadosFiltrados[dataStr] = lucroPorData[dataStr]; break;
                case '1m': if (diffDias >= 0 && diffDias <= 30) dadosFiltrados[dataStr] = lucroPorData[dataStr]; break;
                case '6m': if (diffDias >= 0 && diffDias <= 180) dadosFiltrados[dataStr] = lucroPorData[dataStr]; break;
                case '1a': if (diffDias >= 0 && diffDias <= 365) dadosFiltrados[dataStr] = lucroPorData[dataStr]; break;
                case 'mais': dadosFiltrados[dataStr] = lucroPorData[dataStr]; break;
            }
        }

        console.log('Dados filtrados por período:', dadosFiltrados);

        const roi = numApostas > 0 ? ((totalLucro / totalValorInvestido) * 100).toFixed(2) : 0;
        const progressao = totalLucro > 0 ? ((totalLucro / (totalValorInvestido + totalLucro)) * 100).toFixed(2) : 0;

        totalApostasEl.textContent = numApostas || 0;
        totalLucroEl.textContent = totalLucro.toFixed(2) || '0.00';
        roiEl.textContent = `${roi}%`;
        progressaoEl.textContent = `${progressao}%`;

        return {
            lucroPorStatus: {
                green: apostasSalvas.reduce((sum, a) => a.status?.toLowerCase() === 'green' ? sum + (a.lucro || 0) : sum, 0),
                red: apostasSalvas.reduce((sum, a) => a.status?.toLowerCase() === 'red' ? sum - (a.valor || 0) : sum, 0),
                emAndamento: apostasSalvas.reduce((sum, a) => !['green', 'red'].includes(a.status?.toLowerCase()) ? sum + (a.lucro || 0) : sum, 0)
            },
            progressao: {
                labels: Object.keys(dadosFiltrados).sort(),
                data: Object.values(dadosFiltrados)
            }
        };
    }

    function atualizarGraficoLucro() {
        const dados = calcularDados();
        const isDarkMode = document.body.classList.contains('dark-mode');

        console.log('Dados para gráfico de lucro:', dados.lucroPorStatus);
        if (Object.values(dados.lucroPorStatus).every(v => v === 0)) {
            console.warn('Nenhum dado disponível para lucro por status.');
            lucroCtx.clearRect(0, 0, lucroCanvas.width, lucroCanvas.height);
            lucroCtx.fillStyle = isDarkMode ? '#e0e0e0' : '#333';
            lucroCtx.font = '16px Arial';
            lucroCtx.textAlign = 'center';
            lucroCtx.fillText('Nenhum dado disponível', lucroCanvas.width / 2, lucroCanvas.height / 2);
            if (lucroChart) lucroChart.destroy();
            return;
        }

        const config = {
            type: 'bar',
            data: {
                labels: ['Green', 'Red', 'Em andamento'],
                datasets: [{
                    label: 'Lucro/Perda (R$)',
                    data: [dados.lucroPorStatus.green, dados.lucroPorStatus.red, dados.lucroPorStatus.emAndamento],
                    backgroundColor: [
                        isDarkMode ? '#388e3c' : '#d4edda',
                        isDarkMode ? '#d32f2f' : '#f8d7da',
                        isDarkMode ? '#bb86fc' : '#e0e0ff'
                    ],
                    borderColor: isDarkMode ? '#e0e0e0' : '#333',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Lucro/Perda (R$)',
                            color: isDarkMode ? '#ffffff' : '#333',
                            font: { size: 16, weight: 'bold', family: 'Arial' } 
                        },
                        ticks: {
                            color: isDarkMode ? '#ffffff' : '#333',
                            font: { size: 14, family: 'Arial' }, 
                            callback: function(value) { return 'R$ ' + value; } 
                        },
                        grid: {
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: isDarkMode ? '#ffffff' : '#333',
                            font: { size: 14, family: 'Arial' },
                            maxRotation: 0,
                            minRotation: 0
                        },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: isDarkMode ? '#ffffff' : '#333',
                            font: { size: 16, weight: 'bold', family: 'Arial' }
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        };

        if (lucroChart) lucroChart.destroy();
        try {
            lucroChart = new Chart(lucroCtx, config);
            console.log('Gráfico de lucro criado com sucesso');
        } catch (error) {
            console.error('Erro ao criar gráfico de lucro:', error);
        }
    }

    function atualizarGraficoProgressao() {
        const dados = calcularDados();
        const isDarkMode = document.body.classList.contains('dark-mode');

        console.log('Dados para gráfico de progressão:', dados.progressao);
        if (dados.progressao.labels.length === 0) {
            console.warn('Nenhum dado disponível para progressão.');
            progressaoCtx.clearRect(0, 0, progressaoCanvas.width, progressaoCanvas.height);
            progressaoCtx.fillStyle = isDarkMode ? '#e0e0e0' : '#333';
            progressaoCtx.font = '16px Arial';
            progressaoCtx.textAlign = 'center';
            progressaoCtx.fillText('Nenhum dado disponível', progressaoCanvas.width / 2, progressaoCanvas.height / 2);
            if (progressaoChart) progressaoChart.destroy();
            return;
        }

        let labels = dados.progressao.labels;
        let data = dados.progressao.data;
        if (labels.length === 1) {
            const dataAnterior = new Date(new Date(labels[0]).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            labels = [dataAnterior, labels[0]];
            data = [0, data[0]];
            console.log('Adicionado ponto fictício:', { labels, data });
        }

        const config = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Progressão de Lucro (R$)',
                    data: data,
                    borderColor: isDarkMode ? '#00e676' : '#4CAF50',
                    backgroundColor: isDarkMode ? 'rgba(0, 230, 118, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Lucro/Perda (R$)',
                            color: isDarkMode ? '#ffffff' : '#333',
                            font: { size: 16, weight: 'bold', family: 'Arial' }
                        },
                        ticks: {
                            color: isDarkMode ? '#ffffff' : '#333',
                            font: { size: 14, family: 'Arial' },
                            callback: function(value) { return 'R$ ' + value; }
                        },
                        grid: {
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: isDarkMode ? '#ffffff' : '#333',
                            font: { size: 14, family: 'Arial' },
                            maxRotation: 0,
                            minRotation: 0
                        },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: isDarkMode ? '#ffffff' : '#333',
                            font: { size: 16, weight: 'bold', family: 'Arial' }
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        };

        if (progressaoChart) progressaoChart.destroy();
        try {
            progressaoChart = new Chart(progressaoCtx, config);
            console.log('Gráfico de progressão criado com sucesso');
        } catch (error) {
            console.error('Erro ao criar gráfico de progressão:', error);
        }
    }

    window.mudarPeriodo = function(periodo) {
        periodoAtual = periodo;
        atualizarGraficoProgressao();
    };

    window.toggleDarkMode = function() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        toggleDarkModeBtn.textContent = isDarkMode ? 'Modo Claro' : 'Modo Escuro';
        atualizarGraficoLucro();
        atualizarGraficoProgressao();
    };

    const darkModePreference = localStorage.getItem('darkMode') === 'true';
    if (darkModePreference) {
        document.body.classList.add('dark-mode');
        toggleDarkModeBtn.textContent = 'Modo Claro';
    }

    atualizarGraficoLucro();
    atualizarGraficoProgressao();
});