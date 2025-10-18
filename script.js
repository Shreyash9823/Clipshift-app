import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getDatabase, ref, set, get, remove, push } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyB6XfqnAsp72eYaKvw4kBcGBZaHhO3Zi10",
    authDomain: "clipshift-al-editor.firebaseapp.com",
    databaseURL: "https://clipshift-al-editor-default-rtdb.firebaseio.com",
    projectId: "clipshift-al-editor",
    storageBucket: "clipshift-al-editor.firebasestorage.app",
    messagingSenderId: "84193005731",
    appId: "1:84193005731:web:b31e87da500c2893c32f16",
    measurementId: "G-GT0TBT4SEZ"
};

const GEMINI_API_KEY = "AIzaSyBJ21Ugg9tm-R4rG_rdFL-wT2FOQ5L0rWQ";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let currentPhotoFile = null;
let currentPhotoData = null;
let currentResultImage = null;

document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    initializeTabs();
    initializePhotoStudio();
    initializeVideoStoryboard();
});

function initializeAuth() {
    const signinBtn = document.getElementById('signin-btn');
    const signoutBtn = document.getElementById('signout-btn');
    const userProfile = document.getElementById('user-profile');
    const galleryTab = document.getElementById('gallery-tab');

    signinBtn.addEventListener('click', async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            currentUser = result.user;
        } catch (error) {
            console.error('Sign-in error:', error);
            alert('Failed to sign in. Please try again.');
        }
    });

    signoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            currentUser = null;
        } catch (error) {
            console.error('Sign-out error:', error);
        }
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            signinBtn.classList.add('hidden');
            userProfile.classList.remove('hidden');
            document.getElementById('user-photo').src = user.photoURL;
            document.getElementById('user-name').textContent = user.displayName;
            galleryTab.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            currentUser = null;
            signinBtn.classList.remove('hidden');
            userProfile.classList.add('hidden');
            galleryTab.classList.add('opacity-50', 'cursor-not-allowed');
        }
    });
}

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            if (tabName === 'my-gallery' && !currentUser) {
                alert('Please sign in to view your gallery.');
                return;
            }

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(tabName).classList.add('active');

            if (tabName === 'my-gallery') {
                loadGallery();
            }
        });
    });
}

function initializePhotoStudio() {
    const uploadArea = document.getElementById('photo-upload-area');
    const photoInput = document.getElementById('photo-input');
    const photoPreview = document.getElementById('photo-preview');
    const photoPreviewContainer = document.getElementById('photo-preview-container');
    const photoEditControls = document.getElementById('photo-edit-controls');
    const generateBtn = document.getElementById('generate-btn');
    const photoPrompt = document.getElementById('photo-prompt');
    const photoResultContainer = document.getElementById('photo-result-container');
    const photoResult = document.getElementById('photo-result');
    const saveToGalleryBtn = document.getElementById('save-to-gallery-btn');
    const newEditBtn = document.getElementById('new-edit-btn');

    uploadArea.addEventListener('click', () => photoInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handlePhotoUpload(file);
        }
    });

    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handlePhotoUpload(file);
        }
    });

    generateBtn.addEventListener('click', async () => {
        const prompt = photoPrompt.value.trim();
        if (!prompt) {
            alert('Please enter an editing prompt.');
            return;
        }

        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span class="loading mr-2"></span> Generating...';

        try {
            const editedImage = await generateEditedImage(currentPhotoData, prompt);
            photoResult.src = editedImage;
            currentResultImage = editedImage;
            photoResultContainer.classList.remove('hidden');
        } catch (error) {
            console.error('Generation error:', error);
            alert('Failed to generate edited image. Please try again.');
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = 'Generate Edited Image';
        }
    });

    saveToGalleryBtn.addEventListener('click', async () => {
        if (!currentUser) {
            alert('Please sign in to save to gallery.');
            return;
        }

        if (!currentResultImage) {
            alert('No image to save.');
            return;
        }

        saveToGalleryBtn.disabled = true;
        saveToGalleryBtn.innerHTML = '<span class="loading mr-2"></span> Saving...';

        try {
            await saveToGallery(currentResultImage);
            alert('Image saved to gallery!');
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save image. Please try again.');
        } finally {
            saveToGalleryBtn.disabled = false;
            saveToGalleryBtn.innerHTML = 'Save to Gallery';
        }
    });

    newEditBtn.addEventListener('click', () => {
        resetPhotoStudio();
    });

    function handlePhotoUpload(file) {
        currentPhotoFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            currentPhotoData = e.target.result;
            photoPreview.src = currentPhotoData;
            photoPreviewContainer.classList.remove('hidden');
            photoEditControls.classList.remove('hidden');
            photoResultContainer.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }

    function resetPhotoStudio() {
        currentPhotoFile = null;
        currentPhotoData = null;
        currentResultImage = null;
        photoInput.value = '';
        photoPrompt.value = '';
        photoPreviewContainer.classList.add('hidden');
        photoEditControls.classList.add('hidden');
        photoResultContainer.classList.add('hidden');
    }
}

async function generateEditedImage(imageData, prompt) {
    const base64Data = imageData.split(',')[1];
    
    const requestBody = {
        contents: [{
            parts: [
                { text: `You are an expert image editor. Analyze this image and provide a detailed description of how to edit it based on this instruction: "${prompt}". Be specific about colors, objects, composition, and effects to apply.` },
                {
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: base64Data
                    }
                }
            ]
        }],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
        }
    };

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API error response:', errorData);
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            const description = data.candidates[0].content.parts[0].text;
            console.log('Image analysis:', description);
            
            return await applyImageEdits(imageData, prompt, description);
        }
        
        throw new Error('No valid response from API');
    } catch (error) {
        console.error('Gemini API error:', error);
        if (error.message.includes('API_KEY')) {
            alert('Invalid API key. Please check your Gemini API configuration.');
        }
        throw error;
    }
}

async function applyImageEdits(imageData, prompt, description) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            ctx.drawImage(img, 0, 0);
            
            const promptLower = prompt.toLowerCase();
            
            if (promptLower.includes('blur')) {
                ctx.filter = 'blur(5px)';
                ctx.drawImage(img, 0, 0);
                ctx.filter = 'none';
            }
            
            if (promptLower.includes('brightness') || promptLower.includes('brighter') || promptLower.includes('lighter')) {
                ctx.filter = 'brightness(1.3)';
                ctx.drawImage(img, 0, 0);
                ctx.filter = 'none';
            }
            
            if (promptLower.includes('darker') || promptLower.includes('dark')) {
                ctx.filter = 'brightness(0.7)';
                ctx.drawImage(img, 0, 0);
                ctx.filter = 'none';
            }
            
            if (promptLower.includes('grayscale') || promptLower.includes('black and white') || promptLower.includes('greyscale')) {
                ctx.filter = 'grayscale(100%)';
                ctx.drawImage(img, 0, 0);
                ctx.filter = 'none';
            }
            
            if (promptLower.includes('sepia') || promptLower.includes('vintage') || promptLower.includes('old')) {
                ctx.filter = 'sepia(100%)';
                ctx.drawImage(img, 0, 0);
                ctx.filter = 'none';
            }
            
            if (promptLower.includes('contrast')) {
                ctx.filter = 'contrast(1.5)';
                ctx.drawImage(img, 0, 0);
                ctx.filter = 'none';
            }
            
            if (promptLower.includes('saturate') || promptLower.includes('vibrant') || promptLower.includes('colorful')) {
                ctx.filter = 'saturate(1.5)';
                ctx.drawImage(img, 0, 0);
                ctx.filter = 'none';
            }
            
            if (promptLower.includes('invert')) {
                ctx.filter = 'invert(100%)';
                ctx.drawImage(img, 0, 0);
                ctx.filter = 'none';
            }
            
            if (promptLower.includes('hue') || promptLower.includes('color shift')) {
                ctx.filter = 'hue-rotate(90deg)';
                ctx.drawImage(img, 0, 0);
                ctx.filter = 'none';
            }
            
            if (promptLower.includes('border') || promptLower.includes('frame')) {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 20;
                ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
            }
            
            if (promptLower.includes('text') || promptLower.includes('watermark')) {
                ctx.font = 'bold 48px Arial';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.textAlign = 'center';
                ctx.fillText('Edited by ClipShift AI', canvas.width / 2, canvas.height - 50);
            }
            
            if (promptLower.includes('flip') || promptLower.includes('mirror')) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(img, 0, 0);
            }
            
            if (promptLower.includes('rotate')) {
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = canvas.height;
                tempCanvas.height = canvas.width;
                
                tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
                tempCtx.rotate(90 * Math.PI / 180);
                tempCtx.drawImage(img, -img.width / 2, -img.height / 2);
                
                canvas.width = tempCanvas.width;
                canvas.height = tempCanvas.height;
                ctx.drawImage(tempCanvas, 0, 0);
            }
            
            const editedImageData = canvas.toDataURL('image/jpeg', 0.9);
            resolve(editedImageData);
        };
        
        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };
        
        img.src = imageData;
    });
}

async function saveToGallery(imageData) {
    if (!currentUser) {
        throw new Error('User not authenticated');
    }

    if (!imageData || !imageData.startsWith('data:image')) {
        throw new Error('Invalid image data');
    }

    const galleryRef = ref(database, `creations/${currentUser.uid}`);
    const newItemRef = push(galleryRef);
    
    try {
        await set(newItemRef, {
            imageData: imageData,
            timestamp: Date.now(),
            userId: currentUser.uid
        });
    } catch (error) {
        if (error.code === 'PERMISSION_DENIED') {
            throw new Error('Permission denied. Please check Firebase security rules.');
        }
        throw error;
    }
}

async function loadGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    const galleryEmpty = document.getElementById('gallery-empty');
    const galleryLoading = document.getElementById('gallery-loading');
    const galleryLoginRequired = document.getElementById('gallery-login-required');

    galleryGrid.innerHTML = '';
    galleryEmpty.classList.add('hidden');
    galleryLoginRequired.classList.add('hidden');

    if (!currentUser) {
        galleryLoginRequired.classList.remove('hidden');
        return;
    }

    galleryLoading.classList.remove('hidden');

    try {
        const galleryRef = ref(database, `creations/${currentUser.uid}`);
        const snapshot = await get(galleryRef);

        galleryLoading.classList.add('hidden');

        if (!snapshot.exists()) {
            galleryEmpty.classList.remove('hidden');
            return;
        }

        const items = [];
        snapshot.forEach((childSnapshot) => {
            items.push({
                key: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        items.sort((a, b) => b.timestamp - a.timestamp);

        items.forEach(item => {
            const galleryItem = createGalleryItem(item);
            galleryGrid.appendChild(galleryItem);
        });

    } catch (error) {
        console.error('Load gallery error:', error);
        galleryLoading.classList.add('hidden');
        alert('Failed to load gallery. Please try again.');
    }
}

function createGalleryItem(item) {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    
    const img = document.createElement('img');
    img.src = item.imageData;
    img.alt = 'Gallery image';
    img.onerror = () => {
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999"%3EError%3C/text%3E%3C/svg%3E';
    };
    
    const actions = document.createElement('div');
    actions.className = 'gallery-actions';
    
    const viewBtn = document.createElement('button');
    viewBtn.className = 'text-white text-sm font-medium hover:text-blue-300';
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        viewImage(item.imageData);
    });
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'text-white text-sm font-medium hover:text-green-300';
    downloadBtn.textContent = 'Download';
    downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadImage(item.imageData, item.timestamp);
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'text-white text-sm font-medium hover:text-red-300';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteImage(item.key);
    });
    
    actions.appendChild(viewBtn);
    actions.appendChild(downloadBtn);
    actions.appendChild(deleteBtn);
    div.appendChild(img);
    div.appendChild(actions);
    
    return div;
}

function downloadImage(imageData, timestamp) {
    try {
        const link = document.createElement('a');
        link.href = imageData;
        link.download = `clipshift-${timestamp || Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Download error:', error);
        alert('Failed to download image. Please try right-clicking and saving the image.');
    }
}

function viewImage(imageData) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
    modal.style.cursor = 'pointer';
    
    const img = document.createElement('img');
    img.src = imageData;
    img.className = 'max-w-full max-h-full rounded-lg';
    
    modal.appendChild(img);
    modal.addEventListener('click', () => modal.remove());
    document.body.appendChild(modal);
}

async function deleteImage(key) {
    if (!currentUser) return;
    
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
        const itemRef = ref(database, `creations/${currentUser.uid}/${key}`);
        await remove(itemRef);
        loadGallery();
    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete image. Please try again.');
    }
}

function initializeVideoStoryboard() {
    const uploadArea = document.getElementById('video-upload-area');
    const videoInput = document.getElementById('video-input');
    const videoProcessing = document.getElementById('video-processing');
    const framesContainer = document.getElementById('frames-container');
    const framesGrid = document.getElementById('frames-grid');

    uploadArea.addEventListener('click', () => videoInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) {
            handleVideoUpload(file);
        }
    });

    videoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleVideoUpload(file);
        }
    });

    async function handleVideoUpload(file) {
        videoProcessing.classList.remove('hidden');
        framesContainer.classList.add('hidden');
        framesGrid.innerHTML = '';

        try {
            const frames = await extractFrames(file);
            
            videoProcessing.classList.add('hidden');
            framesContainer.classList.remove('hidden');

            frames.forEach((frameData, index) => {
                const frameItem = createFrameItem(frameData, index);
                framesGrid.appendChild(frameItem);
            });
        } catch (error) {
            console.error('Frame extraction error:', error);
            videoProcessing.classList.add('hidden');
            alert('Failed to extract frames. Please try again.');
        }
    }

    function createFrameItem(frameData, index) {
        const div = document.createElement('div');
        div.className = 'frame-item';
        
        const img = document.createElement('img');
        img.src = frameData;
        img.alt = `Frame ${index + 1}`;
        
        const label = document.createElement('p');
        label.className = 'text-center text-sm text-gray-600 mt-2';
        label.textContent = `Frame ${index + 1}`;
        
        div.appendChild(img);
        div.appendChild(label);
        
        div.addEventListener('click', () => {
            currentPhotoData = frameData;
            document.getElementById('photo-preview').src = frameData;
            document.getElementById('photo-preview-container').classList.remove('hidden');
            document.getElementById('photo-edit-controls').classList.remove('hidden');
            document.getElementById('photo-result-container').classList.add('hidden');
            
            document.querySelector('[data-tab="photo-studio"]').click();
        });
        
        return div;
    }
}

async function extractFrames(videoFile) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        
        const frames = [];
        const frameInterval = 2;
        let isProcessing = false;
        
        const cleanup = () => {
            if (video.src) {
                URL.revokeObjectURL(video.src);
            }
        };
        
        video.onloadedmetadata = () => {
            if (!video.videoWidth || !video.videoHeight) {
                cleanup();
                reject(new Error('Invalid video dimensions'));
                return;
            }
            
            if (video.duration === Infinity || isNaN(video.duration) || video.duration <= 0) {
                cleanup();
                reject(new Error('Invalid video duration. Please try a different video format.'));
                return;
            }
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            canvas.width = Math.min(video.videoWidth, 1920);
            canvas.height = Math.min(video.videoHeight, 1080);
            
            let currentTime = 0;
            const duration = video.duration;
            const maxFrames = 30;
            
            video.onseeked = () => {
                if (isProcessing) return;
                isProcessing = true;
                
                try {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    const scale = Math.min(
                        canvas.width / video.videoWidth,
                        canvas.height / video.videoHeight
                    );
                    const x = (canvas.width - video.videoWidth * scale) / 2;
                    const y = (canvas.height - video.videoHeight * scale) / 2;
                    
                    ctx.drawImage(
                        video,
                        x, y,
                        video.videoWidth * scale,
                        video.videoHeight * scale
                    );
                    
                    const frameData = canvas.toDataURL('image/jpeg', 0.85);
                    frames.push(frameData);
                    
                    currentTime += frameInterval;
                    
                    if (currentTime < duration && frames.length < maxFrames) {
                        video.currentTime = Math.min(currentTime, duration - 0.1);
                        isProcessing = false;
                    } else {
                        cleanup();
                        if (frames.length === 0) {
                            reject(new Error('No frames could be extracted from the video'));
                        } else {
                            resolve(frames);
                        }
                    }
                } catch (error) {
                    cleanup();
                    reject(new Error('Failed to extract frame: ' + error.message));
                }
            };
            
            video.onerror = () => {
                cleanup();
                reject(new Error('Video processing error. Please try a different video.'));
            };
            
            setTimeout(() => {
                if (frames.length === 0) {
                    cleanup();
                    reject(new Error('Video processing timeout. Please try a shorter video.'));
                }
            }, 30000);
            
            video.currentTime = currentTime;
        };
        
        video.onerror = (e) => {
            cleanup();
            const errorMsg = video.error ? 
                `Video load error (code ${video.error.code}): ${video.error.message}` :
                'Failed to load video. Please check the file format.';
            reject(new Error(errorMsg));
        };
        
        try {
            video.src = URL.createObjectURL(videoFile);
            video.load();
        } catch (error) {
            cleanup();
            reject(new Error('Failed to create video URL: ' + error.message));
        }
    });
}
