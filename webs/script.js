document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('category-container');
    const overallFill = document.getElementById('overall-fill');
    const overallPercent = document.getElementById('overall-percent');
    
    const STORAGE_KEY = 'ml_dl_kp_progress';
    let savedProgress = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    
    const categoryNames = {
        'dl': '🧬 Deep Learning (DL)',
        'ml': '🤖 Machine Learning (ML)',
        'rl': '🎮 Reinforcement Learning (RL)'
    };

    function saveProgress() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedProgress));
        updateOverallProgress();
    }

    function updateOverallProgress() {
        let totalItems = 0;
        let checkedItems = 0;

        for (const cat in kpData) {
            totalItems += kpData[cat].length;
            
            let catChecked = 0;
            kpData[cat].forEach(kp => {
                if (savedProgress[`${cat}_${kp}`]) {
                    checkedItems++;
                    catChecked++;
                }
            });
            
            const catStatEl = document.getElementById(`stat-${cat}`);
            if (catStatEl) {
                catStatEl.textContent = `${catChecked} / ${kpData[cat].length}`;
            }
        }

        const percent = totalItems === 0 ? 0 : Math.round((checkedItems / totalItems) * 100);
        overallFill.style.width = `${percent}%`;
        
        let counter = parseInt(overallPercent.textContent) || 0;
        if (counter !== percent) {
            animateValue(overallPercent, counter, percent, 500);
        } else {
            overallPercent.textContent = `${percent}%`;
        }
    }

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start) + "%";
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function formatName(name) {
        return name.split('_')
                   .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                   .join(' ');
    }

    function createUI() {
        let delay = 0;
        
        // Sort categories if needed or just use object keys
        for (const [catCode, kps] of Object.entries(kpData)) {
            const card = document.createElement('div');
            card.className = 'category-card';
            card.style.animationDelay = `${delay}s`;
            delay += 0.1;
            
            const header = document.createElement('div');
            header.className = 'category-header';
            
            const title = document.createElement('h2');
            title.className = 'category-title';
            title.textContent = categoryNames[catCode] || catCode.toUpperCase();
            
            const stats = document.createElement('div');
            stats.className = 'category-stats';
            stats.id = `stat-${catCode}`;
            stats.textContent = `0 / ${kps.length}`;
            
            header.appendChild(title);
            header.appendChild(stats);
            card.appendChild(header);
            
            const list = document.createElement('ul');
            list.className = 'kp-list';
            
            kps.forEach(kp => {
                const li = document.createElement('li');
                const key = `${catCode}_${kp}`;
                const isChecked = !!savedProgress[key];
                
                li.className = `kp-item ${isChecked ? 'checked' : ''}`;
                
                const cbWrapper = document.createElement('div');
                cbWrapper.className = 'checkbox-wrapper';
                
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = isChecked;
                
                const customCb = document.createElement('div');
                customCb.className = 'custom-checkbox';
                
                cbWrapper.appendChild(input);
                cbWrapper.appendChild(customCb);
                
                const label = document.createElement('span');
                label.className = 'kp-label';
                label.textContent = formatName(kp);
                label.title = formatName(kp);
                
                li.appendChild(cbWrapper);
                li.appendChild(label);
                
                li.addEventListener('click', (e) => {
                    // Prevent double firing if checking the box directly
                    if (e.target !== input && e.target !== cbWrapper && e.target !== customCb) {
                        input.checked = !input.checked;
                    }
                    
                    savedProgress[key] = input.checked;
                    if (input.checked) {
                        li.classList.add('checked');
                    } else {
                        li.classList.remove('checked');
                    }
                    saveProgress();
                });
                
                // Allow direct checkbox interaction
                input.addEventListener('change', (e) => {
                    savedProgress[key] = e.target.checked;
                    if (e.target.checked) {
                        li.classList.add('checked');
                    } else {
                        li.classList.remove('checked');
                    }
                    saveProgress();
                });
                
                list.appendChild(li);
            });
            
            card.appendChild(list);
            container.appendChild(card);
        }
        
        updateOverallProgress();
    }

    createUI();
});
