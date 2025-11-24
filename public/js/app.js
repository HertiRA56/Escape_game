// Escape Game - Les Joyaux du Louvre


const { createApp } = Vue;

const API_BASE_URL = '../api';

createApp({
    data() {
        return {
            // carte
            map: null,
            markers: {},
            heatMapLayer: null,
            modoTrapacea: false,
            
            // état du jou
            jogoIniciado: false,
            mostrarIntro: true,
            tempoInicio: null,
            tempoDecorrido: 0,
            timerInterval: null,
            indicesUsados: 0,
            
            // Objets et inventaire
            objetos: [],
            inventario: [],
            itemSelecionado: null,
            
            // Scores
            topScores: [],
            
            // Modals
            modalCodigo: {
                mostrar: false,
                tipo: '', 
                titulo: '',
                codigo: '',
                codigoInserido: '',
                indice: '',
                objetoId: null,
                erro: ''
            },
            modalDica: {
                mostrar: false,
                texto: '',
                objetoNecessario: ''
            },
            modalVitoria: {
                mostrar: false,
                score: 0,
                tempo: 0,
                tempoFormatado: '',
                pseudo: '',
                scoreSalvo: false
            }
        };
    },
    
    computed: {
        tempoFormatado() {
            const minutes = Math.floor(this.tempoDecorrido / 60);
            const seconds = this.tempoDecorrido % 60;
            return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    },
    
    mounted() {
        this.inicializarMapa();
        this.carregarTopScores();
    },
    
    methods: {
        inicializarMapa() {
            // Centralisé dans la prison (point de début)
            this.map = L.map('map').setView([48.834844839924294, 2.3409418435518274], 12);
            
            // OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);
            
            // Ajouter prison marker
            const prisonIcon = L.divIcon({
                html: '🚨',
                className: 'emoji-icon',
                iconSize: [30, 30]
            });
            
            L.marker([48.834844839924294, 2.3409418435518274], { icon: prisonIcon })
                .addTo(this.map)
                .bindPopup('<strong>Prison de Paris</strong><br>Point de début');
        },
        
        /**
         * Commercer le jeu
         */
        async iniciarJogo() {
            this.mostrarIntro = false;
            this.jogoIniciado = true;
            this.tempoInicio = Date.now();
            
            // Compter le temps
            this.timerInterval = setInterval(() => {
                this.tempoDecorrido = Math.floor((Date.now() - this.tempoInicio) / 1000);
            }, 1000);
            
            // Charger les objets de départ
            await this.carregarObjetsDepart();
        },
        
        fecharIntro() {
            
        },
        
    
        async carregarObjetsDepart() {
            try {
                const response = await fetch(`${API_BASE_URL}/objets`);
                const data = await response.json();
                
                if (data.success) {
                    this.objetos = data.data;
                    this.objetos.forEach(objet => {
                        this.creerMarqueur(objet);
                    });
                }
            } catch (error) {
                console.error('Erreur lors du chargement des objets:', error);
                alert("Erreur lors du chargement des objets. Vérifiez si l’API est en fonctionnement.");
            }
        },
        

        creerMarqueur(objet) {
        
            let icon;
            if (objet.icone_url) {
                icon = L.icon({
                    iconUrl: objet.icone_url,
                    iconSize: [objet.icone_width || 32, objet.icone_height || 32],
                    iconAnchor: [objet.icone_anchor_x || 16, objet.icone_anchor_y || 32],
                    popupAnchor: [0, -32]
                });
            } else {
                
                icon = L.divIcon({
                    html: '📍',
                    className: 'emoji-icon',
                    iconSize: [30, 30]
                });
            }
            

            const marker = L.marker([objet.latitude, objet.longitude], {
                icon: icon,
                minZoom: objet.min_zoom_visible
            }).addTo(this.map);
            
            marker.bindPopup(`<strong>${objet.nom}</strong><br>${objet.description || ''}`);
            
            marker.on('click', () => {
                this.onClickObjet(objet);
            });
            
            this.markers[objet.id] = marker;
            
            this.map.on('zoomend', () => {
                const currentZoom = this.map.getZoom();
                if (currentZoom >= objet.min_zoom_visible) {
                    if (!this.map.hasLayer(marker)) {
                        marker.addTo(this.map);
                    }
                } else {
                    if (this.map.hasLayer(marker)) {
                        this.map.removeLayer(marker);
                    }
                }
            });
        },
        
      
        async onClickObjet(objet) {
            console.log('Clicked object:', objet);
            
            switch (objet.type) {
                case 'recuperable':
                    this.handleObjetRecuperable(objet);
                    break;
                case 'code':
                    this.handleObjetCode(objet);
                    break;
                case 'bloque_par_objet':
                    await this.handleObjetBloqueParObjet(objet);
                    break;
                case 'bloque_par_code':
                    await this.handleObjetBloqueParCode(objet);
                    break;
            }
        },
        
       
        handleObjetRecuperable(objet) {
           
            this.inventario.push(objet);
            
        
            if (this.markers[objet.id]) {
                this.map.removeLayer(this.markers[objet.id]);
                delete this.markers[objet.id];
            }
            
            if (objet.nom === 'Bijoux de Napoléon') {
                this.finalizarJogo();
            }
        },
        
    
        handleObjetCode(objet) {
            this.modalCodigo = {
                mostrar: true,
                tipo: 'exibir',
                titulo: objet.nom,
                codigo: objet.code,
                codigoInserido: '',
                indice: '',
                objetoId: objet.id,
                erro: ''
            };
        },
        
       
        async handleObjetBloqueParObjet(objet) {
            // Vérifier si le joueur a l’objet requis sélectionné
            if (this.itemSelecionado && this.itemSelecionado.id === objet.bloque_par_objet_id) {
                // Débloqué l'objet
                await this.desbloquearObjeto(objet);
            } else {
                // Afficher un conseil
                this.indicesUsados++;
                const response = await fetch(`${API_BASE_URL}/objets/${objet.id}/bloquant`);
                const data = await response.json();
                
                if (data.success) {
                    this.modalDica = {
                        mostrar: true,
                        texto: objet.indice_objet,
                        objetoNecessario: data.data.nom
                    };
                }
            }
        },
        
      
        async handleObjetBloqueParCode(objet) {
            this.indicesUsados++;
            const response = await fetch(`${API_BASE_URL}/objets/${objet.id}/bloquant`);
            const data = await response.json();
            
            this.modalCodigo = {
                mostrar: true,
                tipo: 'inserir',
                titulo: objet.nom,
                codigo: '',
                codigoInserido: '',
                indice: objet.indice_code,
                objetoId: objet.id,
                erro: ''
            };
        },
        
        /**
         * Verifier le code
         */
        async verificarCodigo() {
            const code = this.modalCodigo.codigoInserido.trim();
            
            if (code.length !== 4 || !/^\d{4}$/.test(code)) {
                this.modalCodigo.erro = 'O código deve ter 4 dígitos';
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/objets/${this.modalCodigo.objetoId}/verificar-codigo`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code: code })
                });
                
                const data = await response.json();
                
                if (data.success && data.correct) {
                    this.fecharModalCodigo();
                    
                    const objet = this.objetos.find(o => o.id === this.modalCodigo.objetoId);
                    if (objet && data.libere_objet_id) {
                        await this.desbloquearObjeto(objet, data.libere_objet_id);
                    }
                } else {
                    this.modalCodigo.erro = 'Código incorreto. Tente novamente.';
                }
            } catch (error) {
                console.error('Error verifying code:', error);
                this.modalCodigo.erro = 'Erro ao verificar código';
            }
        },
        
        /**
         * Déverrouiller l’objet et charger l’objet libéré
         */
        async desbloquearObjeto(objet, libereObjetId = null) {
            // Retirer l’objet bloquant de la carte
            if (this.markers[objet.id]) {
                this.map.removeLayer(this.markers[objet.id]);
                delete this.markers[objet.id];
            }
            
            // Charger l’objet libéré
            const objetIdToLoad = libereObjetId || objet.libere_objet_id;
            if (objetIdToLoad) {
                await this.chargerObjet(objetIdToLoad);
            }
        },
        
        async chargerObjet(id) {
            try {
                const response = await fetch(`${API_BASE_URL}/objets/${id}`);
                const data = await response.json();
                
                if (data.success) {
                    const objet = data.data;
                    this.objetos.push(objet);
                    this.creerMarqueur(objet);
                    
                    // Se déplacer vers le nouvel objet
                    this.map.setView([objet.latitude, objet.longitude], 15);
                }
            } catch (error) {
                console.error('Error loading object:', error);
            }
        },
        
        /**
         * Sélectionner un objet dans l’inventaire
         */
        selecionarItem(item) {
            if (this.itemSelecionado?.id === item.id) {
                this.itemSelecionado = null;
            } else {
                this.itemSelecionado = item;
            }
        },
        
        /**
         * Charger les meilleurs scores
         */
        async carregarTopScores() {
            try {
                const response = await fetch(`${API_BASE_URL}/scores/top`);
                const data = await response.json();
                
                if (data.success) {
                    this.topScores = data.data;
                }
            } catch (error) {
                console.error('Error loading scores:', error);
            }
        },
        
        /**
         * Terminer le jeu
         */
        finalizarJogo() {
            // Arrêter le chronomètre
            clearInterval(this.timerInterval);
            
            const tempoFinal = Math.floor((Date.now() - this.tempoInicio) / 1000);
            
            // Calculer le score: 10000 - (temps * 10) - (indice * 100)
            let score = 10000 - (tempoFinal * 10) - (this.indicesUsados * 100);
            if (score < 0) score = 0;
            
            // Format temps
            const minutes = Math.floor(tempoFinal / 60);
            const seconds = tempoFinal % 60;
            const tempoFormatado = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            
            // Afficher modal de victorie
            this.modalVitoria = {
                mostrar: true,
                score: score,
                tempo: tempoFinal,
                tempoFormatado: tempoFormatado,
                pseudo: '',
                scoreSalvo: false
            };
        },
        
        /**
         * Sauvegarder score
         */
        async salvarScore() {
            const pseudo = this.modalVitoria.pseudo.trim();
            
            if (!pseudo || pseudo.length > 20) {
                alert("S'il vous plaît, saisissez un nom valide (max 20 caracteres)');
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/scores`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        pseudo: pseudo,
                        score: this.modalVitoria.score,
                        tempo: this.modalVitoria.tempo
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.modalVitoria.scoreSalvo = true;
                    await this.carregarTopScores();
                } else {
                    alert('Erro ao salvar score');
                }
            } catch (error) {
                console.error('Error saving score:', error);
                alert('Erro ao salvar score');
            }
        },
        
        /**
         * Rejouer
         */
        jogarNovamente() {
            location.reload();
        },
        
        /**
         * Activer/Désactiver la carte de chaleur
         */
        toggleHeatMap() {
            if (this.modoTrapacea) {
                this.heatMapLayer = L.tileLayer.wms('http://localhost:8080/geoserver/louvre_escape_game/wms', {
                    layers: 'louvre_escape_game:objet',
                    format: 'image/png',
                    transparent: true,
                    styles: 'heatmap',
                    attribution: 'GeoServer Heat Map'
                }).addTo(this.map);
            } else {
                if (this.heatMapLayer) {
                    this.map.removeLayer(this.heatMapLayer);
                    this.heatMapLayer = null;
                }
            }
        },
        
        /**
         * Fermer des modals
         */
        fecharModalCodigo() {
            this.modalCodigo = {
                mostrar: false,
                tipo: '',
                titulo: '',
                codigo: '',
                codigoInserido: '',
                indice: '',
                objetoId: null,
                erro: ''
            };
        },
        
        fecharModalDica() {
            this.modalDica = {
                mostrar: false,
                texto: '',
                objetoNecessario: ''
            };
        }
    }
}).mount('#app');

