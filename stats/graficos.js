document.addEventListener("DOMContentLoaded", function () {
    
    const toggleDarkModeBtn = document.getElementById('toggleDarkMode');
    const lucroCanvas = document.getElementById('lucroChart');
    const progressaoCanvas = document.getElementById('progressaoChart');
    if (!lucroCanvas || !progressaoCanvas) {
        console.error('Canvas não encontrado:', { lucroCanvas, progressaoCanvas });
        alert('Erro: Canvas não encontrado. Verifique o HTML (ids "lucroChart" e "progressaoChart").');
        return;
    }
    const lucroCtx = lucroCanvas.getContext('2d');
    const progressaoCtx = progressaoCanvas.getContext('2d');
    if (!lucroCtx || !progressaoCtx) {
        console.error('Contexto do canvas inválido:', { lucroCtx, progressaoCtx });
        alert('Erro: Contexto do canvas inválido.');
        return;
    }
    let lucroChart, progressaoChart; // Instâncias dos gráficos
    const totalApostasEl = document.getElementById('totalApostas');
    const totalLucroEl = document.getElementById('totalLucro');
    const roiEl = document.getElementById('roi');
    const progressaoEl = document.getElementById('progressao');
    if (!totalApostasEl || !totalLucroEl || !roiEl || !progressaoEl) {
        console.error('Elementos de estatísticas não encontrados:', { totalApostasEl, totalLucroEl, roiEl, progressaoEl });
        alert('Erro: Elementos de estatísticas não encontrados.');
        return;
    }

    
    let periodoAtual = '1m'; 

    
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

    
    function calcularDados() {
        const apostasSalvas = JSON.parse(localStorage.getItem('apostas') || '[]');
        if (!Array.isArray(apostasSalvas)) {
            console.error('Dados no localStorage não são um array válido:', apostasSalvas);
            alert('Erro: Dados no localStorage inválidos. Reiniciando...');
            localStorage.setItem('apostas', '[]');
            return {
                lucroPorStatus: { green: 0, red: 0, emAndamento: 0 },
                progressao: { labels: [], data: [] }
            };
        }
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

            
            let dataStrOriginal = aposta.data || '';
            let dataStr = formatarData(dataStrOriginal);
            console.log(`Data original: ${dataStrOriginal}, Data formatada: ${dataStr}`);

            let [dia, mes, ano] = dataStr.split('/').map(Number);
            const data = new Date(ano, mes - 1, dia);
            const dataFormatada = data.toISOString().split('T')[0];
            console.log(`Data convertida para ISO: ${dataFormatada}`);

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
            } 
            totalValorInvestido += (aposta.valor || 0);
            console.log(`Lucro parcial para ${dataFormatada}: ${lucroPorData[dataFormatada]}`);
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

        
        const lucroGreen = apostasSalvas.reduce((sum, a) => a.status?.toLowerCase() === 'green' ? sum + (a.lucro || 0) : sum, 0);
        const perdaRed = apostasSalvas.reduce((sum, a) => a.status?.toLowerCase() === 'red' ? sum + (a.valor || 0) : sum, 0);
        const valorEmAndamento = apostasSalvas.reduce((sum, a) => a.status?.toLowerCase() === 'em andamento' ? sum + (a.valor || 0) : sum, 0);
        totalLucro = lucroGreen - perdaRed; 

        const roi = numApostas > 0 ? ((totalLucro / totalValorInvestido) * 100).toFixed(2) : 0;
        const progressao = ((totalLucro / (totalValorInvestido + totalLucro)) * 100).toFixed(2) || 0;

        totalApostasEl.textContent = numApostas || 0;
        totalLucroEl.textContent = totalLucro.toFixed(2) || '0.00';
        roiEl.textContent = `${roi}%`;
        progressaoEl.textContent = `${progressao}%`;

        return {
            lucroPorStatus: {
                green: totalLucro, 
                red: -perdaRed,    
                emAndamento: valorEmAndamento 
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
                    borderWidth: 1,
                    skipNull: false 
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
                            font: { size: 18, weight: 'bold', style: 'normal' },
                            padding: { top: 10, bottom: 10 }
                        },
                        ticks: {
                            color: isDarkMode ? '#ffffff' : '#333',
                            font: { size: 16 },
                            callback: function(value) { return 'R$ ' + (value >= 0 ? value.toFixed(2) : (-value).toFixed(2)); },
                            padding: 5
                        },
                        grid: {
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false,
                            tickLength: 5
                        }
                    },
                    x: {
                        ticks: {
                            color: isDarkMode ? '#ffffff' : '#333',
                            font: { size: 16 },
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
                            font: { size: 16, weight: 'bold' }
                        },
                        position: 'bottom'
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                console.log('Tooltip data:', context);
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += (context.parsed.y >= 0 ? 'R$ ' : '-R$ ') + Math.abs(context.parsed.y).toFixed(2);
                                }
                                return label;
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff'
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                }
            }
        };

        if (lucroChart) lucroChart.destroy();
        try {
            lucroChart = new Chart(lucroCtx, config);
            console.log('Gráfico de lucro criado com sucesso');
        } catch (error) {
            console.error('Erro ao criar gráfico de lucro:', error);
            alert('Erro ao criar gráfico de lucro: ' + error.message);
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
        console.log('Labels antes de ajustar:', labels, 'Data:', data);

        
        let acumulado = 0;
        let dataAcumulada = [];
        labels.forEach((label, index) => {
            acumulado += data[index] || 0;
            dataAcumulada.push(acumulado);
        });
        console.log('Labels ajustadas:', labels, 'Data acumulada:', dataAcumulada);

        const config = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Progressão de Lucro (R$)',
                    data: dataAcumulada,
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
                            text: 'Progressão de Lucro (R$)',
                            color: isDarkMode ? '#ffffff' : '#333',
                            font: { size: 18, weight: 'bold', style: 'normal' },
                            padding: { top: 10, bottom: 10 }
                        },
                        ticks: {
                            color: isDarkMode ? '#ffffff' : '#333',
                            font: { size: 16 },
                            callback: function(value) { return 'R$ ' + value.toFixed(2); },
                            padding: 5
                        },
                        grid: {
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false,
                            tickLength: 5
                        }
                    },
                    x: {
                        ticks: {
                            color: isDarkMode ? '#ffffff' : '#333',
                            font: { size: 16 },
                            maxRotation: 0,
                            minRotation: 0,
                            autoSkip: false 
                        },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: isDarkMode ? '#ffffff' : '#333',
                            font: { size: 16, weight: 'bold' }
                        },
                        position: 'bottom'
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                console.log('Tooltip data:', context);
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += 'R$ ' + context.parsed.y.toFixed(2);
                                }
                                return label;
                            }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff'
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                }
            }
        };

        if (progressaoChart) progressaoChart.destroy();
        try {
            progressaoChart = new Chart(progressaoCtx, config);
            console.log('Gráfico de progressão criado com sucesso');
        } catch (error) {
            console.error('Erro ao criar gráfico de progressão:', error);
            alert('Erro ao criar gráfico de progressão: ' + error.message);
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