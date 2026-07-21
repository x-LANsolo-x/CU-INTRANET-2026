let clubsData = [];
const API_URL = '../api';

const clubModal = new bootstrap.Modal(document.getElementById('clubModal'));

// Load clubs on start
async function loadClubs() {
    try {
        const res = await fetch(`${API_URL}/clubs`);
        clubsData = await res.json();
        updateCategoryCounts();
        renderTable();
    } catch (e) {
        showAlert('Error loading clubs data', 'danger');
    }
}

function updateCategoryCounts() {
    const select = document.getElementById('filterCategory');
    if (!select) return;
    
    // Calculate counts
    const counts = { 'ALL': clubsData.length };
    clubsData.forEach(club => {
        const cat = club.category || 'UNASSIGNED';
        counts[cat] = (counts[cat] || 0) + 1;
    });

    // Update dropdown text while keeping values intact
    Array.from(select.options).forEach(opt => {
        const val = opt.value;
        const count = counts[val] || 0;
        
        // Remove previous count if it exists (e.g. " (5)")
        const baseText = opt.text.replace(/ \(\d+\)$/, '');
        opt.text = `${baseText} (${count})`;
    });
}

function filterClubs() {
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('clubsTableBody');
    tbody.innerHTML = '';

    const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const filterCat = document.getElementById('filterCategory')?.value || 'ALL';

    clubsData.forEach((club, index) => {
        if (filterCat !== 'ALL' && club.category !== filterCat) return;
        
        const titleMatch = club.title?.toLowerCase().includes(searchTerm);
        const facultyMatch = club.faculty?.toLowerCase().includes(searchTerm);
        if (searchTerm && !titleMatch && !facultyMatch) return;

        const logoUrl = club.logo ? `../${club.logo}` : 'https://via.placeholder.com/50';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${logoUrl}" class="logo-preview" alt="logo" loading="lazy"></td>
            <td class="fw-bold">${club.title}</td>
            <td><span class="badge bg-secondary">${club.category}</span></td>
            <td>${club.faculty || 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editClub(${index})">Edit</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openAddModal() {
    document.getElementById('clubForm').reset();
    document.getElementById('clubId').value = '';
    document.getElementById('clubLogoPath').value = '';
    document.getElementById('clubMediaPaths').value = '';
    document.getElementById('hideMediaColumn').checked = false;
    document.getElementById('logoPreviewContainer').innerHTML = '';
    document.getElementById('mediaPreviewContainer').innerHTML = '';
    document.getElementById('deleteBtn').style.display = 'none';
    document.getElementById('clubModalLabel').innerText = 'Add New Club';
    clubModal.show();
}

function editClub(index) {
    const club = clubsData[index];
    document.getElementById('clubId').value = club.id;
    document.getElementById('clubTitle').value = club.title;
    document.getElementById('clubCategory').value = club.category;
    document.getElementById('clubCategories').value = (club.categories || []).join(', ');
    document.getElementById('clubShortDesc').value = club.shortDesc || '';
    document.getElementById('clubLongDesc').value = club.longDesc || '';
    document.getElementById('clubFaculty').value = club.faculty || '';
    document.getElementById('clubContact').value = club.contact || '';
    document.getElementById('clubMembers').value = club.members || '';
    document.getElementById('clubOwner').value = club.owner || '';
    
    document.getElementById('clubLogoPath').value = club.logo || '';
    if (club.logo) {
        document.getElementById('logoPreviewContainer').innerHTML = `<img src="../${club.logo}" class="logo-preview">`;
    } else {
        document.getElementById('logoPreviewContainer').innerHTML = '';
    }

    const mediaList = club.media || [];
    document.getElementById('clubMediaPaths').value = mediaList.join(',');
    document.getElementById('hideMediaColumn').checked = club.hideMediaColumn === true;
    
    renderMediaPreview();

    document.getElementById('deleteBtn').style.display = 'inline-block';
    document.getElementById('clubModalLabel').innerText = 'Edit Club';
    clubModal.show();
}

function renderMediaPreview() {
    const pathsStr = document.getElementById('clubMediaPaths').value;
    const mediaList = pathsStr ? pathsStr.split(',') : [];
    const mediaContainer = document.getElementById('mediaPreviewContainer');
    mediaContainer.innerHTML = '';
    mediaList.forEach((m, idx) => {
        mediaContainer.innerHTML += `
            <div class="media-item-wrapper">
                <img src="../${m}" class="media-preview">
                <div class="media-actions">
                    <button type="button" onclick="moveMediaLeft(${idx})" title="Move Left">&larr;</button>
                    <button type="button" class="delete-btn" onclick="removeMedia(${idx})" title="Delete">&times;</button>
                    <button type="button" onclick="moveMediaRight(${idx})" title="Move Right">&rarr;</button>
                </div>
            </div>`;
    });
}

function moveMediaLeft(idx) {
    if (idx === 0) return;
    const pathsStr = document.getElementById('clubMediaPaths').value;
    const mediaList = pathsStr ? pathsStr.split(',') : [];
    const temp = mediaList[idx - 1];
    mediaList[idx - 1] = mediaList[idx];
    mediaList[idx] = temp;
    document.getElementById('clubMediaPaths').value = mediaList.join(',');
    renderMediaPreview();
}

function moveMediaRight(idx) {
    const pathsStr = document.getElementById('clubMediaPaths').value;
    const mediaList = pathsStr ? pathsStr.split(',') : [];
    if (idx === mediaList.length - 1) return;
    const temp = mediaList[idx + 1];
    mediaList[idx + 1] = mediaList[idx];
    mediaList[idx] = temp;
    document.getElementById('clubMediaPaths').value = mediaList.join(',');
    renderMediaPreview();
}

function removeMedia(idx) {
    if (!confirm('Are you sure you want to remove this image from the gallery?')) return;
    const pathsStr = document.getElementById('clubMediaPaths').value;
    const mediaList = pathsStr ? pathsStr.split(',') : [];
    mediaList.splice(idx, 1);
    document.getElementById('clubMediaPaths').value = mediaList.join(',');
    renderMediaPreview();
}

async function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                const dataUrl = canvas.toDataURL('image/webp', 0.8);
                resolve({
                    base64: dataUrl.split(',')[1],
                    filename: file.name.replace(/\.[^/.]+$/, "") + ".webp"
                });
            };
            img.onerror = err => reject(err);
            img.src = event.target.result;
        };
        reader.onerror = err => reject(err);
    });
}

async function fetchWithRetry(url, options, retries = 1) {
    try {
        const res = await fetch(url, options);
        if (!res.ok && res.status >= 500 && retries > 0) {
            console.log("Request failed with 5xx, retrying to handle cold start...");
            return fetchWithRetry(url, options, retries - 1);
        }
        return res;
    } catch (err) {
        if (retries > 0) {
            console.log("Network error, retrying...");
            return fetchWithRetry(url, options, retries - 1);
        }
        throw err;
    }
}

async function uploadLogo() {
    const fileInput = document.getElementById('logoUpload');
    if (fileInput.files.length === 0) return alert('Select a logo first');
    
    const btn = fileInput.nextElementSibling;
    const originalText = btn.innerText;
    btn.innerText = "Uploading...";
    btn.disabled = true;

    try {
        const { base64: base64Data, filename: newFilename } = await compressImage(fileInput.files[0]);
        const payload = {
            type: 'logo',
            filename: newFilename,
            base64: base64Data
        };

        const res = await fetchWithRetry(`${API_URL}/upload`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload) 
        });
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('clubLogoPath').value = data.filePath;
            document.getElementById('logoPreviewContainer').innerHTML = `<img src="../${data.filePath}" class="logo-preview">`;
            showAlert('Logo uploaded to GitHub successfully', 'success');
        } else {
            showAlert('Upload failed: ' + data.error, 'danger');
        }
    } catch(e) {
        console.error(e);
        showAlert('Upload error', 'danger');
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function uploadMedia() {
    const fileInput = document.getElementById('mediaUpload');
    if (fileInput.files.length === 0) return alert('Select media files first');
    
    const clubId = document.getElementById('clubId').value || 'new-club-' + Date.now();
    document.getElementById('clubId').value = clubId; 
    
    const btn = fileInput.nextElementSibling;
    const originalText = btn.innerText;
    btn.innerText = "Uploading...";
    btn.disabled = true;

    try {
        let uploadedPaths = [];
        for (let i = 0; i < fileInput.files.length; i++) {
            const { base64: base64Data, filename: newFilename } = await compressImage(fileInput.files[i]);
                    const payload = {
                        type: 'media',
                        clubId: clubId,
                        filename: newFilename,
                        base64: base64Data
                    };
                    
                    const res = await fetchWithRetry(`${API_URL}/upload`, { 
                        method: 'POST', 
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload) 
                    });
            const data = await res.json();
            if (data.success) {
                uploadedPaths.push(data.filePath);
            } else {
                console.error("Failed to upload file", data);
            }
        }
        
        if (uploadedPaths.length > 0) {
            let existing = document.getElementById('clubMediaPaths').value;
            let existingArr = existing ? existing.split(',') : [];
            let newArr = existingArr.concat(uploadedPaths);
            document.getElementById('clubMediaPaths').value = newArr.join(',');
            
            renderMediaPreview();
            showAlert(`${uploadedPaths.length} media files uploaded to GitHub!`, 'success');
        }
    } catch(e) {
        console.error(e);
        showAlert('Upload error', 'danger');
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function saveClub() {
    const clubId = document.getElementById('clubId').value || document.getElementById('clubTitle').value.replace(/\s+/g, '-').toLowerCase();
    
    const clubObj = {
        id: clubId,
        title: document.getElementById('clubTitle').value,
        category: document.getElementById('clubCategory').value,
        categories: document.getElementById('clubCategories').value.split(',').map(s=>s.trim()).filter(s=>s),
        shortDesc: document.getElementById('clubShortDesc').value,
        longDesc: document.getElementById('clubLongDesc').value,
        faculty: document.getElementById('clubFaculty').value,
        contact: document.getElementById('clubContact').value,
        members: document.getElementById('clubMembers').value,
        owner: document.getElementById('clubOwner').value,
        logo: document.getElementById('clubLogoPath').value,
        hideMediaColumn: document.getElementById('hideMediaColumn').checked,
        media: document.getElementById('clubMediaPaths').value ? document.getElementById('clubMediaPaths').value.split(',') : []
    };

    const existingIndex = clubsData.findIndex(c => c.id === clubId);
    if (existingIndex >= 0) {
        clubsData[existingIndex] = clubObj;
    } else {
        clubsData.push(clubObj);
    }

    await saveToServer();
    clubModal.hide();
    updateCategoryCounts();
    renderTable();
}

async function deleteCurrentClub() {
    if(!confirm('Are you sure you want to delete this club?')) return;
    const clubId = document.getElementById('clubId').value;
    clubsData = clubsData.filter(c => c.id !== clubId);
    await saveToServer();
    clubModal.hide();
    updateCategoryCounts();
    renderTable();
}

async function saveToServer() {
    try {
        const res = await fetchWithRetry(`${API_URL}/clubs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clubsData)
        });
        if(res.ok) showAlert('Clubs saved successfully!', 'success');
        else throw new Error('Failed');
    } catch(e) {
        showAlert('Failed to save to server', 'danger');
    }
}

function showAlert(msg, type) {
    const alertHtml = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
    document.getElementById('alertContainer').innerHTML = alertHtml;
    setTimeout(() => {
        document.getElementById('alertContainer').innerHTML = '';
    }, 3000);
}

// Init
loadClubs();
