document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('category-container');
    const overallFill = document.getElementById('overall-fill');
    const overallPercent = document.getElementById('overall-percent');
    
    const STORAGE_KEY = 'ml_dl_kp_progress';
    let savedProgress = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    
    const TERMS_STORAGE_KEY = 'ml_dl_kp_terms';
    let savedTerms = JSON.parse(localStorage.getItem(TERMS_STORAGE_KEY) || '{}');
    
    // Migration check: convert array of strings to array of objects
    for (const k in savedTerms) {
        if (Array.isArray(savedTerms[k]) && savedTerms[k].length > 0 && typeof savedTerms[k][0] === 'string') {
            savedTerms[k] = savedTerms[k].map(t => ({ name: t, children: [] }));
        }
    }
    
    
    const CUSTOM_KP_KEY = 'ml_dl_custom_kp';
    let customKPData = JSON.parse(localStorage.getItem(CUSTOM_KP_KEY) || '{ "dl": [], "ml": [], "rl": [] }');
    for(const cat in customKPData) {
        if(!kpData[cat]) kpData[cat] = [];
        kpData[cat] = [...new Set([...kpData[cat], ...customKPData[cat]])];
    }
    
    const CUSTOM_NAME_KEY = 'ml_dl_custom_names';
    let customNames = JSON.parse(localStorage.getItem(CUSTOM_NAME_KEY) || '{}');
    
    function saveCustomNames() {
        localStorage.setItem(CUSTOM_NAME_KEY, JSON.stringify(customNames));
    }
    
    // Instead of using formatName(kp) directly, we wrap it
    function getDisplayName(key, defaultName) {
        return customNames[key] || defaultName;
    }

    const QA_STORAGE_KEY = 'ml_dl_kp_qa';
    let savedQA = JSON.parse(localStorage.getItem(QA_STORAGE_KEY) || '{}');

    function saveCustomKPs() {
        localStorage.setItem(CUSTOM_KP_KEY, JSON.stringify(customKPData));
    }
    function saveQA() {
        localStorage.setItem(QA_STORAGE_KEY, JSON.stringify(savedQA));
    }
    
    // Notes logic in terms
    // We already use savedTerms. We will store notes in termObj.note = "..."

    const categoryNames = {
        'dl': 'Deep Learning (DL)',
        'ml': 'Machine Learning (ML)',
        'rl': 'Reinforcement Learning (RL)'
    };

    function saveProgress() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedProgress));
        updateOverallProgress();
        if(typeof applyFilters !== 'undefined') applyFilters();
    }

    function saveTerms() {
        localStorage.setItem(TERMS_STORAGE_KEY, JSON.stringify(savedTerms));
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

    function getTextBoundingSize(text, fontSize, paddingH, paddingV) {
        let charLen = 0;
        for (let i = 0; i < text.length; i++) {
            charLen += text.charCodeAt(i) > 255 ? 2 : 1;
        }
        // approximate width: half font size for ascii, full for CJK
        const w = (charLen * (fontSize * 0.55)) + paddingH * 2;
        const h = fontSize + paddingV * 2;
        return [w, h];
    }

    function createUI() {
        let delay = 0;
        
        // Sort categories if needed or just use object keys
        for (const [catCode, kps] of Object.entries(kpData)) {
            const card = document.createElement('div');
            card.className = 'category-card';
            card.setAttribute('data-catcode', catCode);
            card.style.animationDelay = `${delay}s`;
            delay += 0.1;
            
            const header = document.createElement('div');
            header.className = 'category-header';
            
            const title = document.createElement('h2');
            title.className = 'category-title';
            title.textContent = getDisplayName(catCode, categoryNames[catCode] || catCode.toUpperCase());
            title.style.cursor = 'text';
            title.title = '双击重命名分类';
            
            title.ondblclick = (e) => {
                e.stopPropagation();
                const currentText = title.textContent;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentText;
                input.style.fontSize = '1.6rem';
                input.style.fontWeight = '700';
                input.style.border = '1px solid var(--accent)';
                input.style.background = 'white';
                input.style.borderRadius = '8px';
                input.style.padding = '2px 8px';
                input.style.width = '100%';
                
                const saveName = () => {
                    const newName = input.value.trim();
                    if(newName && newName !== currentText) {
                        customNames[catCode] = newName;
                        saveCustomNames();
                    }
                    title.textContent = getDisplayName(catCode, categoryNames[catCode] || catCode.toUpperCase());
                    header.replaceChild(title, input);
                    
                };
                
                input.onblur = saveName;
                input.onkeydown = (evt) => { if(evt.key === 'Enter') input.blur(); };
                
                header.replaceChild(input, title);
                input.focus();
            };
            
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
                li.setAttribute('data-kpkey', key);
                
                const headerDiv = document.createElement('div');
                headerDiv.className = 'kp-item-header';
                
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
                const defaultKpName = formatName(kp);
                label.textContent = getDisplayName(key, defaultKpName);
                label.title = '双击重命名知识点';
                
                label.ondblclick = (e) => {
                    e.stopPropagation();
                    const currentText = label.textContent;
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = currentText;
                    input.style.fontSize = '1rem';
                    input.style.fontWeight = '500';
                    input.style.border = '1px solid var(--accent)';
                    input.style.borderRadius = '4px';
                    input.style.padding = '0 4px';
                    
                    const saveKpName = () => {
                        const newName = input.value.trim();
                        if(newName && newName !== currentText) {
                            customNames[key] = newName;
                            saveCustomNames();
                        }
                        label.textContent = getDisplayName(key, defaultKpName);
                        headerDiv.replaceChild(label, input);
                        
                    };
                    
                    input.onblur = saveKpName;
                    input.onkeydown = (evt) => { if(evt.key === 'Enter') input.blur(); };
                    
                    headerDiv.replaceChild(input, label);
                    input.focus();
                };
                
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'kp-actions';
                
                const qaBtn = document.createElement('button');
                qaBtn.className = 'icon-btn';
                qaBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
                qaBtn.title = '问答笔记';
                qaBtn.onclick = (e) => {
                    e.stopPropagation();
                    openQAModal(key, formatName(kp));
                };
                
                const delBtn = document.createElement('button');
                delBtn.className = 'icon-btn delete-kp';
                delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
                delBtn.title = '删除此知识点';
                delBtn.onclick = (e) => {
                    e.stopPropagation();
                    if(confirm('确定删除此知识点？')) {
                        // remove from custom
                        if(customKPData[catCode]) {
                            customKPData[catCode] = customKPData[catCode].filter(x => x !== kp);
                            saveCustomKPs();
                        }
                        // remove from runtime data
                        kpData[catCode] = kpData[catCode].filter(x => x !== kp);
                        delete savedProgress[key];
                        saveProgress();
                        // re-render UI completely
                        container.innerHTML = '';
                        createUI();
                    }
                };
                
                actionsDiv.appendChild(qaBtn);
                actionsDiv.appendChild(delBtn);
                
                headerDiv.appendChild(cbWrapper);
                headerDiv.appendChild(label);
                headerDiv.appendChild(actionsDiv);
                
                li.appendChild(headerDiv);
                
                const tagsContainer = document.createElement('div');
                tagsContainer.className = 'term-tags-container';
                
                function createTermTree(containerElement, termArray) {
                    const sorted = [...termArray].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
                    
                    const leafTerms = sorted.filter(t => !t.children || t.children.length === 0);
                    const branchTerms = sorted.filter(t => t.children && t.children.length > 0);

                    const createNode = (termObj) => {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'term-node-wrapper';

                        const row = document.createElement('div');
                        row.className = 'term-tag-row';

                        const tag = document.createElement('span');
                        tag.className = 'term-tag';

                        const nameSpan = document.createElement('span');
                        nameSpan.textContent = termObj.name;
                        
                        const actions = document.createElement('div');
                        actions.style.display = 'flex';
                        actions.style.alignItems = 'center';
                        actions.style.gap = '2px';

                        const noteBtn = document.createElement('span');
                        noteBtn.className = 'action-btn note-btn';
                        noteBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>';
                        noteBtn.onclick = (e) => {
                            e.stopPropagation();
                            openNoteModal(termObj, key);
                        };

                        const addBtn = document.createElement('span');
                        addBtn.className = 'action-btn add-sub-btn';
                        addBtn.textContent = '+';
                        
                        const delBtn = document.createElement('span');
                        delBtn.className = 'action-btn remove-btn';
                        delBtn.textContent = '✕';

                        actions.appendChild(noteBtn);
                        actions.appendChild(addBtn);
                        actions.appendChild(delBtn);

                        tag.appendChild(nameSpan);
                        tag.appendChild(actions);
                        row.appendChild(tag);
                        wrapper.appendChild(row);

                        const childrenContainer = document.createElement('div');
                        childrenContainer.className = 'term-children';
                        if (!termObj.children || termObj.children.length === 0) {
                            childrenContainer.classList.add('hidden');
                        }

                        tag.addEventListener('dblclick', (e) => {
                            e.stopPropagation();
                            tag.classList.add('hidden');
                            
                            const editInput = document.createElement('input');
                            editInput.className = 'term-input';
                            editInput.value = termObj.name;
                            
                            editInput.addEventListener('blur', () => {
                                const newVal = editInput.value.trim();
                                if (newVal && newVal !== termObj.name) {
                                    termObj.name = newVal;
                                    saveTerms();
                                }
                                renderTags();
                            });
                            
                            editInput.addEventListener('keydown', (evt) => {
                                if (evt.key === 'Enter') editInput.blur();
                            });
                            
                            row.insertBefore(editInput, tag);
                            editInput.focus();
                        });

                        delBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const idx = termArray.findIndex(t => t === termObj);
                            if (idx > -1) {
                                termArray.splice(idx, 1);
                                saveTerms();
                                renderTags();
                            }
                        });

                        addBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            childrenContainer.classList.remove('hidden');
                            const inputField = document.createElement('input');
                            inputField.className = 'term-input';
                            inputField.type = 'text';
                            inputField.placeholder = '子词条...';

                            inputField.addEventListener('blur', () => {
                                const val = inputField.value.trim();
                                if (val) {
                                    if (!termObj.children) termObj.children = [];
                                    if (!termObj.children.find(c => c.name === val)) {
                                        termObj.children.push({ name: val, children: [] });
                                        saveTerms();
                                    }
                                }
                                renderTags();
                            });

                            inputField.addEventListener('keydown', (evt) => {
                                if (evt.key === 'Enter') inputField.blur();
                            });

                            childrenContainer.appendChild(inputField);
                            inputField.focus();
                        });

                        if (termObj.children && termObj.children.length > 0) {
                            createTermTree(childrenContainer, termObj.children);
                        }
                        
                        wrapper.appendChild(childrenContainer);
                        return wrapper;
                    };

                    if (leafTerms.length > 0) {
                        const leafContainer = document.createElement('div');
                        leafContainer.className = 'term-leaf-container';
                        leafTerms.forEach(t => leafContainer.appendChild(createNode(t)));
                        containerElement.appendChild(leafContainer);
                    }

                    if (branchTerms.length > 0) {
                        const branchContainer = document.createElement('div');
                        branchContainer.className = 'term-branch-container';
                        branchTerms.forEach(t => branchContainer.appendChild(createNode(t)));
                        containerElement.appendChild(branchContainer);
                    }
                }

                function renderTags() {
                    tagsContainer.innerHTML = '';
                    const treeRoot = document.createElement('div');
                    treeRoot.className = 'term-tree-root';
                    
                    if (!savedTerms[key]) {
                        savedTerms[key] = [];
                    }
                    createTermTree(treeRoot, savedTerms[key]);

                    const rootAddBtn = document.createElement('button');
                    rootAddBtn.className = 'add-term-btn';
                    rootAddBtn.textContent = '+';
                    rootAddBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        rootAddBtn.classList.add('hidden');
                        const inputField = document.createElement('input');
                        inputField.className = 'term-input';
                        inputField.type = 'text';
                        inputField.placeholder = '回车确认';
                        
                        inputField.addEventListener('blur', () => {
                            const val = inputField.value.trim();
                            if (val) {
                                if (!savedTerms[key].find(c => c.name === val)) {
                                    savedTerms[key].push({ name: val, children: [] });
                                    saveTerms();
                                }
                            }
                            renderTags();
                        });
                        
                        inputField.addEventListener('keydown', (evt) => {
                            if (evt.key === 'Enter') inputField.blur();
                        });
                        
                        treeRoot.appendChild(inputField);
                        inputField.focus();
                    });
                    
                    tagsContainer.appendChild(treeRoot);
                    treeRoot.appendChild(rootAddBtn);
                }
                
                renderTags();
                li.appendChild(tagsContainer);
                
                headerDiv.addEventListener('click', (e) => {
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
                        const footer = document.createElement('div');
            footer.className = 'category-footer';
            const addKpBtn = document.createElement('button');
            addKpBtn.className = 'add-term-btn';
            addKpBtn.style.width = '30px';
            addKpBtn.style.height = '30px';
            addKpBtn.style.fontSize = '1.2rem';
            addKpBtn.textContent = '+';
            addKpBtn.onclick = () => {
                const kpName = prompt('输入新的知识点名称 (英文或小写横线分隔):');
                if(kpName && kpName.trim() !== '') {
                    const formatted = kpName.trim().replace(/\s+/g, '_').toLowerCase();
                    if(!customKPData[catCode]) customKPData[catCode] = [];
                    if(!customKPData[catCode].includes(formatted) && !kpData[catCode].includes(formatted)) {
                        customKPData[catCode].push(formatted);
                        kpData[catCode].push(formatted);
                        saveCustomKPs();
                        container.innerHTML = '';
                        createUI();
                    }
                }
            };
            footer.appendChild(addKpBtn);
            card.appendChild(footer);

            container.appendChild(card);
        }
        
        updateOverallProgress();
        if(typeof applyFilters !== 'undefined') applyFilters();
    }

    // Graph Logic
    const graphModal = document.getElementById('graph-modal');
    const openGraphBtn = document.getElementById('open-graph-btn');
    const closeGraphBtn = document.getElementById('close-graph-btn');
    let echartsInstance = null;
    let collapsedNodes = new Set();
    let currentZoom = 1;
    let isGraphEventsBound = false;

    openGraphBtn.addEventListener('click', () => {
        graphModal.classList.remove('hidden');
        setTimeout(renderGraph, 100);
    });

    closeGraphBtn.addEventListener('click', () => {
        graphModal.classList.add('hidden');
    });

    function renderGraph() {
        if (!echartsInstance) {
            echartsInstance = echarts.init(document.getElementById('graph-container'));
        }

        const baseNodesMap = new Map();
        const allEdges = [];
        const termMap = {}; // id -> { name, depth, parents: set, children: set }
        const kpChildrenMap = {}; // kpId -> Set of child termIds
        const kpRoots = [];

                // Pre-set 12 nice distinct colors
        const presetHues = [
            0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330
        ];
        
        function getAlphaColor(h, s, l, a) {
            return `hsla(${h}, ${s}%, ${l}%, ${a})`;
        }
        
        const kpRootBaseHues = {};
        
        function getHslStyle(rootSourceId, depth, isChecked) {
            const h = kpRootBaseHues[rootSourceId] || 0;
            const s = isChecked ? 65 : 45;
            const l = isChecked ? 45 : 65;
            
            let alpha = 1.0;
            if(depth === 0) {
                alpha = isChecked ? 1.0 : 0.7;
            } else {
                alpha = Math.max(0.1, 0.5 - ((depth - 1) * 0.1));
            }
            
            const textColor = l < 50 && alpha > 0.4 ? '#ffffff' : '#111111';
            const bgColor = getAlphaColor(h, s, l, alpha);
            const borderColor = getAlphaColor(h, s, l - 10, alpha + 0.2); 
            
            return { bg: bgColor, text: textColor, border: borderColor, hue: h };
        }

        // Process data
        for (const [catCode, kps] of Object.entries(kpData)) {
            kps.forEach(kp => {
                const key = `${catCode}_${kp}`;
                const termsTree = savedTerms[key] || [];
                
                if (termsTree.length > 0) {
                    const kpNodeId = key;
                    kpRoots.push(kpNodeId);
                    kpRootBaseHues[kpNodeId] = presetHues[(kpRoots.length - 1) % presetHues.length];
                    if (!kpChildrenMap[kpNodeId]) kpChildrenMap[kpNodeId] = new Set();
                    
                    const isChecked = !!savedProgress[kpNodeId];
                    if (!baseNodesMap.has(kpNodeId)) {
                        const kpName = getDisplayName(kpNodeId, formatName(kp));
                        const [w, h] = getTextBoundingSize(kpName, 13, 14, 8);
                        baseNodesMap.set(kpNodeId, {
                            id: kpNodeId,
                            name: kpName,
                            symbolSize: [w, h],
                            baseStyle: getHslStyle(kpNodeId, 0, !!savedProgress[kpNodeId])
                        });
                    }

                    // Process tree
                    function traverseTerms(treeArray, parentId, currentDepth, rootNodeId) {
                        treeArray.forEach(termObj => {
                            const termId = `term_${termObj.name}`;
                            if (!termMap[termId]) {
                                termMap[termId] = {
                                    name: termObj.name,
                                    depth: currentDepth,
                                    parents: new Set(),
                                    children: new Set(),
                                    rootSources: new Set()
                                };
                            } else {
                                termMap[termId].depth = Math.min(termMap[termId].depth, currentDepth);
                            }
                            termMap[termId].parents.add(parentId);
                            termMap[termId].rootSources.add(rootNodeId);

                            if (parentId.startsWith('term_')) {
                                if (termMap[parentId]) termMap[parentId].children.add(termId);
                            } else {
                                kpChildrenMap[parentId].add(termId);
                            }

                            if (termObj.children && termObj.children.length > 0) {
                                traverseTerms(termObj.children, termId, currentDepth + 1, rootNodeId);
                            }
                        });
                    }
                    traverseTerms(termsTree, kpNodeId, 1, kpNodeId);
                }
            });
        }


                // Add Term Nodes and Edges
        for (const [termId, data] of Object.entries(termMap)) {
            const depth = Math.min(data.depth, 4);
            
            let primaryRootId = null;
            if (data.rootSources.size > 0) {
                primaryRootId = Array.from(data.rootSources)[0];
            }
            
            let style = null;
            if (primaryRootId) {
                const isChecked = !!savedProgress[primaryRootId];
                style = getHslStyle(primaryRootId, depth, isChecked);
            } else {
                style = { bg: '#fca5a5', text: '#7f1d1d', border: '#f87171', hue: 0 }; // Fallback red
            }
            
            const [w, h] = getTextBoundingSize(data.name, 11, 10, 5);
            
            baseNodesMap.set(termId, {
                id: termId,
                name: data.name,
                symbolSize: [w, h],
                baseStyle: style
            });

            data.parents.forEach(pId => {
                allEdges.push({ source: pId, target: termId, hue: style.hue });
            });
        }

        // --- Network Visibility BFS (for collapsing) ---
        const activeNodes = new Set();
        const queue = [...kpRoots];
        kpRoots.forEach(id => activeNodes.add(id));

        while(queue.length > 0) {
            const current = queue.shift();
            if (collapsedNodes.has(current)) continue; // Drop children if collapsed

            const children = termMap[current] ? termMap[current].children : (kpChildrenMap[current] || new Set());
            children.forEach(childId => {
                // If the child is not active yet, push it (it means at least one parent is active and not collapsed)
                if (!activeNodes.has(childId)) {
                    activeNodes.add(childId);
                    queue.push(childId);
                }
            });
        }

        // --- Render Target Generation ---
        const nodes = [];
        const edges = [];
        const isZoomedOut = currentZoom < 0.6; // Scale Threshold

        baseNodesMap.forEach((data, id) => {
            if (!activeNodes.has(id)) return;
            const isTermNode = id.startsWith('term_');
            
            // Collapsed visual cue
            const isCollapsed = collapsedNodes.has(id);
            const shadowIntensity = isCollapsed ? 0 : (isTermNode ? 0 : 10);
            
            if (isZoomedOut && isTermNode) {
                // Semantic zooming: Shrink leaf nodes to distinct dots, hiding text
                nodes.push({
                    id: data.id,
                    name: data.name,
                    symbol: 'circle',
                    symbolSize: 8,
                    itemStyle: { 
                        color: data.baseStyle.bg, 
                        borderColor: data.baseStyle.border,
                        borderWidth: 1 
                    },
                    label: { show: false }
                });
            } else {
                nodes.push({
                    id: data.id,
                    name: data.name,
                    symbolSize: data.symbolSize,
                    itemStyle: {
                        color: 'transparent'
                    },
                    label: {
                        show: true,
                        position: 'center',
                        formatter: isCollapsed ? '{b} +' : '{b}',
                        backgroundColor: data.baseStyle.bg,
                        color: data.baseStyle.text,
                        padding: isTermNode ? [5, 10] : [8, 14],
                        borderRadius: isTermNode ? 12 : 8,
                        fontSize: isTermNode ? 11 : 13,
                        fontWeight: isTermNode ? 500 : 600,
                        borderWidth: isCollapsed ? 2 : 1,
                        borderColor: data.baseStyle.border,
                        shadowColor: 'rgba(0,0,0,0.15)',
                        shadowBlur: shadowIntensity
                    }
                });
            }
        });

        allEdges.forEach(edge => {
            if (activeNodes.has(edge.source) && activeNodes.has(edge.target)) {
                edges.push({
                    source: edge.source,
                    target: edge.target,
                    lineStyle: {
                        color: `hsla(${edge.hue || 0}, 50%, 60%, 0.4)`
                    }
                });
            }
        });

        const option = {
            tooltip: {},
            animationDurationUpdate: 1500,
            animationEasingUpdate: 'quinticInOut',
            series: [{
                type: 'graph',
                layout: 'force',
                symbolSize: 30,
                roam: true, // allow zoom and drag
                label: {
                    show: true
                },
                edgeSymbol: ['none', 'none'],
                force: {
                    repulsion: 400,
                    gravity: 0.15,
                    edgeLength: [80, 150]
                },
                data: nodes,
                links: edges,
                lineStyle: {
                    curveness: 0.15,
                    opacity: 0.8,
                    width: 2
                }
            }]
        };

        echartsInstance.setOption(option);

        // Bind events if not already bound
        if (!isGraphEventsBound) {
            isGraphEventsBound = true;

            // Click node to collapse / expand
            echartsInstance.on('click', (params) => {
                if (params.dataType === 'node') {
                    const nodeId = params.data.id;
                    if (collapsedNodes.has(nodeId)) {
                        collapsedNodes.delete(nodeId);
                    } else {
                        collapsedNodes.add(nodeId);
                    }
                    renderGraph(); // trigger localized topological redraw
                }
            });

            // Roam to detect Zoom scale and trigger semantic visual scaling
            echartsInstance.on('graphRoam', (params) => {
                if (params.zoom != null) {
                    // Accumulate exact zoom manually if needed, or query from the engine
                    const option = echartsInstance.getOption();
                    if (option && option.series && option.series[0]) {
                        const nextZoom = option.series[0].zoom;
                        if (nextZoom) {
                            const wasZoomedOut = currentZoom < 0.6;
                            const isZoomedOut = nextZoom < 0.6;
                            currentZoom = nextZoom;
                            
                            // Re-render ONLY if crossing the semantic zoom threshold
                            if (wasZoomedOut !== isZoomedOut) {
                                renderGraph();
                            }
                        }
                    }
                }
            });
        }
    }

    // Handles modal resizing
    window.addEventListener('resize', () => {
        if (echartsInstance && !graphModal.classList.contains('hidden')) {
            echartsInstance.resize();
        }
    });

    
    // Modal Logistics
    const noteModal = document.getElementById('note-modal');
    const closeNoteBtn = document.getElementById('close-note-btn');
    const noteTextarea = document.getElementById('note-textarea');
    const previewNoteBtn = document.getElementById('preview-note-btn');
    const notePreviewArea = document.getElementById('note-preview-area');
    const saveNoteBtn = document.getElementById('save-note-btn');
    
    let currentNoteTerm = null;
    let currentNoteKey = null;

    function openNoteModal(termObj, kpKey) {
        currentNoteTerm = termObj;
        currentNoteKey = kpKey;
        noteTextarea.value = termObj.note || '';
        notePreviewArea.innerHTML = termObj.note ? formatTextWithMath(termObj.note) : '';
        document.getElementById('note-modal-title').textContent = `编辑笔记: ${termObj.name}`;
        noteModal.classList.remove('hidden');
        if (window.MathJax) {
            MathJax.typesetPromise([notePreviewArea]).catch((err) => console.log(err));
        }
    }

    closeNoteBtn.onclick = () => noteModal.classList.add('hidden');
    saveNoteBtn.onclick = () => {
        if(currentNoteTerm) {
            currentNoteTerm.note = noteTextarea.value;
            saveTerms();
            noteModal.classList.add('hidden');
        }
    };
    previewNoteBtn.onclick = () => {
        notePreviewArea.innerHTML = formatTextWithMath(noteTextarea.value);
        if (window.MathJax) {
            MathJax.typesetPromise([notePreviewArea]).catch((err) => console.log(err));
        }
    };

    const qaModal = document.getElementById('qa-modal');
    const closeQaBtn = document.getElementById('close-qa-btn');
    const qaList = document.getElementById('qa-list');
    const qaQuestion = document.getElementById('qa-question');
    const qaAnswer = document.getElementById('qa-answer');
    const saveQaBtn = document.getElementById('save-qa-btn');
    const previewQaBtn = document.getElementById('preview-qa-btn');
    const qaPreviewArea = document.getElementById('qa-preview-area');
    
    let currentQAKpKey = null;

    function formatTextWithMath(text) {
        return text.replace(/\n/g, '<br>');
    }

    function renderQAList() {
        qaList.innerHTML = '';
        const list = savedQA[currentQAKpKey] || [];
        if(list.length === 0) {
            qaList.innerHTML = '<p style="color:#888;text-align:center;">暂无问答笔记</p>';
            return;
        }
        list.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'qa-item';
            div.innerHTML = `
                <h4>Q: ${formatTextWithMath(item.q)}</h4>
                <div class="qa-ans">A: ${formatTextWithMath(item.a)}</div>
                <button class="glass-btn-small" style="margin-top:0.5rem;color:red;" onclick="deleteQA('${currentQAKpKey}', ${idx})">删除</button>
            `;
            qaList.appendChild(div);
        });
        if (window.MathJax) {
            MathJax.typesetPromise([qaList]).catch((err) => console.log(err));
        }
    }

    window.deleteQA = function(kpKey, idx) {
        if(confirm("删除此问答?")) {
            savedQA[kpKey].splice(idx, 1);
            saveQA();
            renderQAList();
        }
    }

    function openQAModal(kpKey, kpName) {
        currentQAKpKey = kpKey;
        document.getElementById('qa-modal-title').textContent = `问答笔记: ${kpName}`;
        renderQAList();
        qaQuestion.value = '';
        qaAnswer.value = '';
        qaPreviewArea.innerHTML = '';
        qaModal.classList.remove('hidden');
    }

    closeQaBtn.onclick = () => qaModal.classList.add('hidden');
    saveQaBtn.onclick = () => {
        const q = qaQuestion.value.trim();
        const a = qaAnswer.value.trim();
        if(q && a) {
            if(!savedQA[currentQAKpKey]) savedQA[currentQAKpKey] = [];
            savedQA[currentQAKpKey].push({ q, a });
            saveQA();
            qaQuestion.value = '';
            qaAnswer.value = '';
            renderQAList();
        } else {
            alert('问题和答案均不能为空');
        }
    };
    
    previewQaBtn.onclick = () => {
        qaPreviewArea.innerHTML = `<b>Q:</b> ${formatTextWithMath(qaQuestion.value)}<br><div style="margin-top:8px;"><b>A:</b> ${formatTextWithMath(qaAnswer.value)}</div>`;
        if (window.MathJax) {
            MathJax.typesetPromise([qaPreviewArea]).catch((err) => console.log(err));
        }
    };

    // Toolbar Logic
    const searchInput = document.getElementById('search-input');
    const toggleCollapseBtn = document.getElementById('toggle-collapse-btn');
    let isCollapsed = false;

    function applyFilters() {
        const query = searchInput.value.toLowerCase();
        
        // Show/Hide category cards and kp items
        const cards = document.querySelectorAll('.category-card');
        
        const kpsInDom = document.querySelectorAll('.kp-item');
        kpsInDom.forEach(kpNode => {
            const labelText = kpNode.querySelector('.kp-label').textContent.toLowerCase();
            let showBySearch = labelText.includes(query);
            
            if(showBySearch) {
                kpNode.style.display = 'flex';
            } else {
                kpNode.style.display = 'none';
            }
        });
        
        // Hide empty category cards
        cards.forEach(card => {
             let hasVisibleChild = Array.from(card.querySelectorAll('.kp-item')).some(k => k.style.display !== 'none');
             card.style.display = hasVisibleChild ? 'block' : 'none';
        });
    }

    searchInput.addEventListener('input', applyFilters);

    toggleCollapseBtn.onclick = () => {
        isCollapsed = !isCollapsed;
        toggleCollapseBtn.textContent = isCollapsed ? '全部展开' : '全部折叠';
        
        const trees = document.querySelectorAll('.term-tags-container');
        trees.forEach(t => {
            if(isCollapsed) t.classList.add('hidden');
            else t.classList.remove('hidden');
        });
    };
    const graphExpandAllBtn = document.getElementById('graph-expand-all');
    const graphCollapseAllBtn = document.getElementById('graph-collapse-all');
    if(graphExpandAllBtn) graphExpandAllBtn.onclick = () => {
        collapsedNodes.clear();
        if(!graphModal.classList.contains('hidden')) renderGraph();
    };
    if(graphCollapseAllBtn) graphCollapseAllBtn.onclick = () => {
        // Collect all kpRoot Ids since they are the ones we collapse
        const kpRootsInDom = document.querySelectorAll('.category-card');
        kpRootsInDom.forEach(card => {
            const catCode = card.getAttribute('data-catcode');
            const kpsNodes = card.querySelectorAll('.kp-item');
            kpsNodes.forEach(kn => {
                const kpKey = kn.getAttribute('data-kpkey');
                if(kpKey) collapsedNodes.add(kpKey);
            });
        });
        if(!graphModal.classList.contains('hidden')) renderGraph();
    };
    
    createUI();
});
