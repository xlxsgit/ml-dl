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
    
    const categoryNames = {
        'dl': 'Deep Learning (DL)',
        'ml': 'Machine Learning (ML)',
        'rl': 'Reinforcement Learning (RL)'
    };

    function saveProgress() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedProgress));
        updateOverallProgress();
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
                label.textContent = formatName(kp);
                label.title = formatName(kp);
                
                headerDiv.appendChild(cbWrapper);
                headerDiv.appendChild(label);
                
                li.appendChild(headerDiv);
                
                const tagsContainer = document.createElement('div');
                tagsContainer.className = 'term-tags-container';
                
                function createTermTree(containerElement, termArray) {
                    const sorted = [...termArray].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
                    sorted.forEach(termObj => {
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

                        const addBtn = document.createElement('span');
                        addBtn.className = 'action-btn add-sub-btn';
                        addBtn.textContent = '+';
                        
                        const delBtn = document.createElement('span');
                        delBtn.className = 'action-btn remove-btn';
                        delBtn.textContent = '✕';

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
                        containerElement.appendChild(wrapper);
                    });
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
            container.appendChild(card);
        }
        
        updateOverallProgress();
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

        // Process data
        for (const [catCode, kps] of Object.entries(kpData)) {
            kps.forEach(kp => {
                const key = `${catCode}_${kp}`;
                const termsTree = savedTerms[key] || [];
                
                if (termsTree.length > 0) {
                    const kpNodeId = key;
                    kpRoots.push(kpNodeId);
                    if (!kpChildrenMap[kpNodeId]) kpChildrenMap[kpNodeId] = new Set();
                    
                    const kpColor = catCode === 'dl' ? '#15803d' : (catCode === 'ml' ? '#22c55e' : '#4ade80');
                    if (!baseNodesMap.has(kpNodeId)) {
                        const kpName = formatName(kp);
                        const [w, h] = getTextBoundingSize(kpName, 13, 14, 8);
                        baseNodesMap.set(kpNodeId, {
                            id: kpNodeId,
                            name: kpName,
                            symbolSize: [w, h],
                            baseStyle: { bg: kpColor, text: '#ffffff', border: kpColor }
                        });
                    }

                    // Process tree
                    function traverseTerms(treeArray, parentId, currentDepth) {
                        treeArray.forEach(termObj => {
                            const termId = `term_${termObj.name}`;
                            if (!termMap[termId]) {
                                termMap[termId] = {
                                    name: termObj.name,
                                    depth: currentDepth,
                                    parents: new Set(),
                                    children: new Set()
                                };
                            } else {
                                termMap[termId].depth = Math.min(termMap[termId].depth, currentDepth);
                            }
                            termMap[termId].parents.add(parentId);

                            if (parentId.startsWith('term_')) {
                                if (termMap[parentId]) termMap[parentId].children.add(termId);
                            } else {
                                kpChildrenMap[parentId].add(termId);
                            }

                            if (termObj.children && termObj.children.length > 0) {
                                traverseTerms(termObj.children, termId, currentDepth + 1);
                            }
                        });
                    }
                    traverseTerms(termsTree, kpNodeId, 1);
                }
            });
        }

        const depthColors = {
            1: { bg: '#86efac', text: '#14532d', border: '#4ade80' },
            2: { bg: '#bbf7d0', text: '#166534', border: '#86efac' },
            3: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
            4: { bg: '#f0fdf4', text: '#166534', border: '#dcfce7' }
        };

        // Add Term Nodes and Edges
        for (const [termId, data] of Object.entries(termMap)) {
            const depth = Math.min(data.depth, 4);
            const style = depthColors[depth] || depthColors[4];
            const [w, h] = getTextBoundingSize(data.name, 11, 10, 5);
            
            baseNodesMap.set(termId, {
                id: termId,
                name: data.name,
                symbolSize: [w, h],
                baseStyle: style
            });

            data.parents.forEach(pId => {
                allEdges.push({ source: pId, target: termId });
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
                edges.push(edge);
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
                    color: '#86efac',
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

    createUI();
});
