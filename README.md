# Gemini Node Editor

A high-performance, visual node-based workflow engine for building and executing multi-modal AI pipelines using the Google Gemini API.

![Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## 🚀 Overview

The **Gemini Node Editor** provides a visual programming interface for complex AI tasks. By abstracting the Gemini API into discrete, connectable nodes, users can build sophisticated workflows ranging from stylized image generation and editing to deep visual analysis and batch image processing.

## ✨ Key Features

- **Visual Workflow Engine**: Drag-and-drop interface for connecting inputs and outputs across a topological execution graph.
- **Dynamic Prompt Styler**: A sophisticated style library driven by an extensible YAML system. Apply hundreds of artistic styles (3D, Cinematic, Anime, Vector, etc.) with automatic prompt templating.
- **Multi-Modal Generation**: Supports text-to-image, image-to-image editing, and image-to-text descriptions using the latest `gemini-3-flash-preview` and `gemini-2.5-flash-image` models.
- **Image Processing Toolkit**: Dedicated nodes for non-AI utilities including:
  - **Stitching**: Join images horizontally or vertically.
  - **Cropping & Padding**: Aspect ratio management for social media.
  - **Solid Color Generation**: Dynamic canvas generation for backdrop prototyping.
- **Template System**: Pre-built workflow patterns for standard tasks like "Style Transfer," "Product Studio," and "Visual Analysis."
- **Execution History**: Persistent tracking of generated results with high-resolution preview and download capabilities.

## 🛠 Technical Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS.
- **AI Core**: `@google/genai` (Google Gemini SDK).
- **State Management**: Custom React Hooks for topological sorting and workflow execution.
- **Build System**: Vite.

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- A Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/gemini-node-editor.git
    cd gemini-node-editor
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    Create a `.env.local` file in the root directory and add your API key:
    ```env
    GEMINI_API_KEY=your_actual_api_key_here
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## 📖 Usage

1.  **Right-click or Double-click** on the canvas to open the "Add Node" menu.
2.  Connect nodes by dragging from an **Output Port** (right side) to a compatible **Input Port** (left side).
3.  Click the **Play Icon** (bottom-left) or press `Ctrl + Enter` to execute the workflow.
4.  Use `Ctrl + Mouse Drag` for marquee selection or the **Scroll Wheel** to zoom.

---

**Copyright © 2026 Mohammad Aboul-Ela**  
*Built with passion for the future of visual AI orchestration.*