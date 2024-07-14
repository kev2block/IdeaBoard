// DOM Elements
const newIdeaBtn = document.getElementById('newIdeaBtn');
const searchInput = document.getElementById('searchInput');
const ideaBoard = document.getElementById('ideaBoard');
const modal = document.getElementById('modal');
const closeBtn = document.getElementsByClassName('close')[0];
const ideaForm = document.getElementById('ideaForm');
const modalTitle = document.getElementById('modalTitle');
const boardBtn = document.getElementById('boardBtn');
const whiteboard = document.getElementById('whiteboard');
const addFieldBtn = document.getElementById('addFieldBtn');
const toggleBgBtn = document.getElementById('toggleBgBtn');
const whiteboardCanvas = document.getElementById('whiteboardCanvas');
const filterSelect = document.getElementById('filterSelect');
const backBtn = document.getElementById('backBtn');

// State
let ideas = JSON.parse(localStorage.getItem('ideas')) || [];
let fields = JSON.parse(localStorage.getItem('fields')) || [];
let connections = JSON.parse(localStorage.getItem('connections')) || [];

// jsPlumb instance
let jsPlumbInstance;
let editMode = false;
let editIdeaId = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeJsPlumb();
    renderIdeas();
    renderFieldsAndConnections();
});
newIdeaBtn.addEventListener('click', openModalForNewIdea);
closeBtn.addEventListener('click', closeModal);
window.addEventListener('click', outsideClick);
ideaForm.addEventListener('submit', saveIdea);
searchInput.addEventListener('input', renderIdeas);
boardBtn.addEventListener('click', toggleWhiteboard);
backBtn.addEventListener('click', toggleWhiteboard);
addFieldBtn.addEventListener('click', addField);
toggleBgBtn.addEventListener('change', toggleBackground);
filterSelect.addEventListener('change', renderIdeas);

// Functions
function initializeJsPlumb() {
    jsPlumbInstance = jsPlumb.getInstance({
        Connector: ["Bezier", { curviness: 50 }],
        Anchors: ["TopCenter", "BottomCenter"],
        PaintStyle: { stroke: "#3498db", strokeWidth: 2 },
        EndpointStyle: { radius: 5, fill: "#3498db" },
        HoverPaintStyle: { stroke: "#2980b9" }
    });

    jsPlumbInstance.setContainer(whiteboardCanvas);

    jsPlumbInstance.bind('connection', function(info) {
        const connection = {
            sourceId: info.sourceId,
            targetId: info.targetId
        };

        if (!connections.some(conn => 
            (conn.sourceId === connection.sourceId && conn.targetId === connection.targetId) ||
            (conn.sourceId === connection.targetId && conn.targetId === connection.sourceId)
        )) {
            connections.push(connection);
            localStorage.setItem('connections', JSON.stringify(connections));
        }
    });

    jsPlumbInstance.bind('connectionDetached', function(info) {
        connections = connections.filter(conn => 
            !(conn.sourceId === info.sourceId && conn.targetId === info.targetId) &&
            !(conn.sourceId === info.targetId && conn.targetId === info.sourceId)
        );
        localStorage.setItem('connections', JSON.stringify(connections));
    });

    jsPlumbInstance.bind('beforeDrop', function(info) {
        if (info.targetId === null || info.targetId === undefined) {
            const sourceEl = document.getElementById(info.sourceId);
            const rect = sourceEl.getBoundingClientRect();
            const newFieldId = createNewField(rect.right + 20, rect.top);
            jsPlumbInstance.connect({
                source: info.sourceId,
                target: newFieldId
            });
            return false;
        }
        return true;
    });
}

function openModalForNewIdea() {
    modal.style.display = 'block';
    modalTitle.textContent = 'New Idea';
    ideaForm.reset();
    editMode = false;
    editIdeaId = null;
}

function openModalForEditIdea(idea) {
    modal.style.display = 'block';
    modalTitle.textContent = 'Edit Idea';
    document.getElementById('ideaTitle').value = idea.title;
    document.getElementById('ideaDescription').value = idea.description;
    document.getElementById('ideaCategory').value = idea.category;
    editMode = true;
    editIdeaId = idea.id;
}

function closeModal() {
    modal.style.display = 'none';
}

function outsideClick(e) {
    if (e.target === modal) {
        closeModal();
    }
}

function saveIdea(e) {
    e.preventDefault();
    const title = document.getElementById('ideaTitle').value;
    const description = document.getElementById('ideaDescription').value;
    const category = document.getElementById('ideaCategory').value;

    if (editMode && editIdeaId !== null) {
        const idea = ideas.find(idea => idea.id === editIdeaId);
        if (idea) {
            idea.title = title;
            idea.description = description;
            idea.category = category;
            idea.updatedAt = new Date().toISOString();
        }
    } else {
        const newIdea = {
            id: Date.now(),
            title,
            description,
            category,
            createdAt: new Date().toISOString(),
            list: []
        };
        ideas.push(newIdea);
    }

    localStorage.setItem('ideas', JSON.stringify(ideas));
    closeModal();
    renderIdeas();
}

function renderIdeas() {
    ideaBoard.innerHTML = '';
    const filteredIdeas = ideas.filter(idea => 
        (filterSelect.value === 'all' || idea.category === filterSelect.value) &&
        (idea.title.toLowerCase().includes(searchInput.value.toLowerCase()) || 
         idea.description.toLowerCase().includes(searchInput.value.toLowerCase()))
    );

    filteredIdeas.forEach(idea => {
        const ideaCard = document.createElement('div');
        ideaCard.classList.add('idea-card');
        ideaCard.innerHTML = `
            <h3>${idea.title}</h3>
            <p>${idea.description}</p>
            <span class="category">${idea.category}</span>
            <button onclick="editIdea(${idea.id})" class="btn">Edit</button>
            <button onclick="deleteIdea(${idea.id})" class="btn">Delete</button>
        `;

        // Add list functionality
        const listContainer = document.createElement('div');
        listContainer.className = 'list-container';
        listContainer.innerHTML = `
            <h4>List</h4>
            <ul id="list-${idea.id}"></ul>
            <input type="text" id="listInput-${idea.id}" placeholder="Add list item">
            <button onclick="addListItem(${idea.id})" class="btn">Add Item</button>
        `;
        ideaCard.appendChild(listContainer);

        ideaBoard.appendChild(ideaCard);

        // Render existing list items
        if (idea.list) {
            idea.list.forEach(item => {
                addListItemToDOM(idea.id, item);
            });
        }
    });
}

function addListItem(ideaId) {
    const listInput = document.getElementById(`listInput-${ideaId}`);
    const listItem = listInput.value.trim();
    if (listItem !== '') {
        const idea = ideas.find(idea => idea.id === ideaId);
        idea.list.push(listItem);
        localStorage.setItem('ideas', JSON.stringify(ideas));
        addListItemToDOM(ideaId, listItem);
        listInput.value = '';
    }
}

function addListItemToDOM(ideaId, listItem) {
    const listUl = document.getElementById(`list-${ideaId}`);
    const listLi = document.createElement('li');
    listLi.textContent = listItem;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-list-item';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.addEventListener('click', () => deleteListItem(ideaId, listItem));

    listLi.appendChild(deleteBtn);
    listUl.appendChild(listLi);
}

function deleteListItem(ideaId, listItem) {
    const idea = ideas.find(idea => idea.id === ideaId);
    if (idea) {
        idea.list = idea.list.filter(item => item !== listItem);
        localStorage.setItem('ideas', JSON.stringify(ideas));
        renderIdeas();
    }
}

function editIdea(id) {
    const idea = ideas.find(idea => idea.id === id);
    if (idea) {
        openModalForEditIdea(idea);
    }
}

function deleteIdea(id) {
    if (confirm('Are you sure you want to delete this idea?')) {
        ideas = ideas.filter(idea => idea.id !== id);
        localStorage.setItem('ideas', JSON.stringify(ideas));
        renderIdeas();
    }
}

function toggleWhiteboard() {
    whiteboard.classList.toggle('hidden');
    if (!whiteboard.classList.contains('hidden')) {
        setTimeout(() => {
            jsPlumbInstance.repaintEverything();
        }, 0);
    }
}

function addField() {
    const fieldId = `field-${Date.now()}`;
    const field = {
        id: fieldId,
        left: `${Math.random() * (whiteboardCanvas.clientWidth - 200)}px`,
        top: `${Math.random() * (whiteboardCanvas.clientHeight - 150)}px`,
        content: 'Enter text here...',
        extendedText: '',
        fontSize: '16px',
        color: '#000000'
    };

    fields.push(field);
    localStorage.setItem('fields', JSON.stringify(fields));
    renderField(field);
}

function createNewField(left, top) {
    const fieldId = `field-${Date.now()}`;
    const field = {
        id: fieldId,
        left: `${left}px`,
        top: `${top}px`,
        content: 'Enter text here...',
        extendedText: '',
        fontSize: '16px',
        color: '#000000'
    };

    fields.push(field);
    localStorage.setItem('fields', JSON.stringify(fields));
    renderField(field);

    return fieldId;
}

function renderField(field) {
    const fieldElement = document.createElement('div');
    fieldElement.className = 'whiteboard-field';
    fieldElement.id = field.id;
    fieldElement.style.left = field.left;
    fieldElement.style.top = field.top;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteField(field.id);
    });

    const imageBtn = document.createElement('button');
    imageBtn.className = 'image-btn';
    imageBtn.innerHTML = '<i class="fas fa-image"></i>';
    imageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addImage(fieldElement);
    });

    const textBtn = document.createElement('button');
    textBtn.className = 'text-btn';
    textBtn.innerHTML = 'Text';
    textBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openTextEditor(fieldElement);
    });

    const content = document.createElement('div');
    content.className = 'content';
    content.contentEditable = true;
    content.style.fontSize = field.fontSize;
    content.style.color = field.color;
    content.innerHTML = field.content;

    // Add event listener to remove placeholder text on focus
    content.addEventListener('focus', () => {
        if (content.innerHTML === 'Enter text here...') {
            content.innerHTML = '';
        }
    });

    // Add event listener to add placeholder text if the field is empty on blur
    content.addEventListener('blur', () => {
        if (content.innerHTML.trim() === '') {
            content.innerHTML = 'Enter text here...';
        }
        updateFieldContent(field.id, content.innerHTML);
    });

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    fieldElement.addEventListener('mousedown', (e) => {
        if (!e.target.classList.contains('connection-point')) {
            isDragging = false;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = parseInt(fieldElement.style.left);
            initialTop = parseInt(fieldElement.style.top);

            const onMouseMove = (e) => {
                isDragging = true;
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                fieldElement.style.left = `${initialLeft + deltaX}px`;
                fieldElement.style.top = `${initialTop + deltaY}px`;
                jsPlumbInstance.repaintEverything(); // Repaint connections
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                if (isDragging) {
                    const updatedField = fields.find(f => f.id === field.id);
                    if (updatedField) {
                        updatedField.left = fieldElement.style.left;
                        updatedField.top = fieldElement.style.top;
                        localStorage.setItem('fields', JSON.stringify(fields));
                        jsPlumbInstance.repaintEverything(); // Repaint connections
                    }
                }
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }
    });

    fieldElement.addEventListener('click', (e) => {
        if (!isDragging) {
            setTimeout(() => {
                content.focus();
                placeCaretAtEnd(content);
            }, 0);
        }
    });

    content.addEventListener('click', (e) => {
        if (!isDragging) {
            e.stopPropagation();
            setTimeout(() => {
                content.focus();
                placeCaretAtEnd(content);
            }, 0);
        }
    });

    fieldElement.appendChild(deleteBtn);
    fieldElement.appendChild(imageBtn);
    fieldElement.appendChild(textBtn);
    fieldElement.appendChild(content);

    // Add connection points
    const positions = ['top', 'right', 'bottom', 'left'];
    positions.forEach(pos => {
        const point = document.createElement('div');
        point.className = `connection-point ${pos}`;
        fieldElement.appendChild(point);
    });

    whiteboardCanvas.appendChild(fieldElement);

    jsPlumbInstance.draggable(fieldElement, {
        containment: 'parent',
        handle: '.content',
        filter: '.connection-point',
        stop: function(event) {
            const updatedField = fields.find(f => f.id === field.id);
            if (updatedField) {
                updatedField.left = fieldElement.style.left;
                updatedField.top = fieldElement.style.top;
                localStorage.setItem('fields', JSON.stringify(fields));
                jsPlumbInstance.repaintEverything(); // Repaint connections
            }
        }
    });

    jsPlumbInstance.makeSource(fieldElement, {
        filter: '.connection-point',
        anchor: 'Continuous'
    });

    jsPlumbInstance.makeTarget(fieldElement, {
        filter: '.connection-point',
        anchor: 'Continuous'
    });
}

function renderFieldsAndConnections() {
    // Clear existing fields and connections
    whiteboardCanvas.innerHTML = '';
    jsPlumbInstance.deleteEveryEndpoint();
    
    // Render fields
    fields.forEach(renderField);
    
    // Render connections
    connections.forEach(conn => {
        jsPlumbInstance.connect({
            source: conn.sourceId,
            target: conn.targetId
        });
    });
}

function deleteField(id) {
    jsPlumbInstance.remove(id);
    fields = fields.filter(field => field.id !== id);
    connections = connections.filter(conn => conn.sourceId !== id && conn.targetId !== id);
    localStorage.setItem('fields', JSON.stringify(fields));
    localStorage.setItem('connections', JSON.stringify(connections));
    jsPlumbInstance.repaintEverything(); // Repaint connections
}

function addImage(fieldElement) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const contentDiv = fieldElement.querySelector('.content');
                const img = document.createElement('img');
                img.src = event.target.result;
                img.style.pointerEvents = 'none';  // Make image non-draggable
                img.className = 'whiteboard-image';
                
                const imgWrapper = document.createElement('div');
                imgWrapper.className = 'image-wrapper';
                imgWrapper.appendChild(img);
                
                const deleteImgBtn = document.createElement('button');
                deleteImgBtn.className = 'delete-img-btn';
                deleteImgBtn.innerHTML = '&times;';
                deleteImgBtn.addEventListener('click', () => {
                    imgWrapper.remove();
                    updateFieldContent(fieldElement.id, contentDiv.innerHTML);
                });
                
                imgWrapper.appendChild(deleteImgBtn);
                contentDiv.appendChild(imgWrapper);
                updateFieldContent(fieldElement.id, contentDiv.innerHTML);
                placeCaretAtEnd(contentDiv);
                jsPlumbInstance.repaintEverything(); // Repaint connections
            }
            reader.readAsDataURL(file);
        }
    }
    input.click();
}

function openTextEditor(fieldElement) {
    const textEditor = document.createElement('div');
    textEditor.className = 'text-editor';
    textEditor.innerHTML = `
        <textarea></textarea>
        <div>
            <input type="color" class="font-color" value="#000000">
            <select class="font-size">
                <option value="12px">12px</option>
                <option value="16px">16px</option>
                <option value="20px">20px</option>
                <option value="24px">24px</option>
            </select>
            <button class="save-text">Save</button>
        </div>
    `;
    
    whiteboardCanvas.appendChild(textEditor);
    
    const textarea = textEditor.querySelector('textarea');
    const fontColor = textEditor.querySelector('.font-color');
    const fontSize = textEditor.querySelector('.font-size');
    const saveBtn = textEditor.querySelector('.save-text');
    
    const field = fields.find(f => f.id === fieldElement.id);
    textarea.value = field.extendedText || '';
    fontColor.value = field.color;
    fontSize.value = field.fontSize;
    
    saveBtn.addEventListener('click', () => {
        field.extendedText = textarea.value;
        field.color = fontColor.value;
        field.fontSize = fontSize.value;
        
        fieldElement.querySelector('.content').style.color = fontColor.value;
        fieldElement.querySelector('.content').style.fontSize = fontSize.value;
        
        localStorage.setItem('fields', JSON.stringify(fields));
        whiteboardCanvas.removeChild(textEditor);
        jsPlumbInstance.repaintEverything(); // Repaint connections
    });
}

function updateFieldContent(fieldId, content) {
    const field = fields.find(f => f.id === fieldId);
    if (field) {
        field.content = content;
        localStorage.setItem('fields', JSON.stringify(fields));
        jsPlumbInstance.repaintEverything(); // Repaint connections
    }
}

function toggleBackground() {
    whiteboardCanvas.style.backgroundColor = toggleBgBtn.checked ? '#808080' : '#ecf0f1';
}

// Utility function to place caret at the end
function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.body.createTextRange !== "undefined") {
        const textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
}

// Initial render
renderIdeas();
renderFieldsAndConnections();