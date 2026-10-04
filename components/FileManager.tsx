import React, { useState, useEffect, useCallback, ChangeEvent, useRef } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { fetchFiles, uploadFile, createFile, createFolder, deleteItem, downloadFile, renameItem } from '../lib/api';
import { cn } from '../lib/utils';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Represents a file or folder item in the file manager.
 */
interface FileSystemItem {
  name: string;
  path: string;
  is_directory: boolean;
  size?: number; // in bytes, optional for directories
  last_modified?: string; // ISO 8601 string
}

/**
 * Props for the FileManager component.
 */
interface FileManagerProps {
  /**
   * The initial path to display in the file manager.
   * @default '/'
   */
  initialPath?: string;
}

/**
 * A web-based file manager component, allowing users to browse, upload, download, and manage files on the connected system.
 *
 * @param {FileManagerProps} props - The props for the component.
 * @returns {JSX.Element} The rendered FileManager component.
 */
const FileManager: React.FC<FileManagerProps> = ({ initialPath = '/' }) => {
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [showNewFileModal, setShowNewFileModal] = useState<boolean>(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [renameItemPath, setRenameItemPath] = useState<string | null>(null);
  const [renameItemName, setRenameItemName] = useState<string>('');

  /**
   * Fetches the file system items for the current path.
   * @param {string} path - The path to fetch items from.
   */
  const fetchItems = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFiles(path);
      setItems(data);
      setCurrentPath(path);
    } catch (err: any) {
      console.error('Failed to fetch files:', err);
      setError(err.message || 'Failed to load files.');
      toast.error(`Failed to load files: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems(initialPath);
  }, [initialPath, fetchItems]);

  /**
   * Handles navigation into a directory.
   * @param {string} dirName - The name of the directory to enter.
   */
  const handleOpenFolder = (dirName: string) => {
    const newPath = currentPath === '/' ? `/${dirName}` : `${currentPath}/${dirName}`;
    fetchItems(newPath);
  };

  /**
   * Navigates up to the parent directory.
   */
  const handleGoBack = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    if (parentPath !== currentPath) {
      fetchItems(parentPath);
    }
  };

  /**
   * Formats file size into a human-readable string.
   * @param {number | undefined} bytes - The size in bytes.
   * @returns {string} The formatted size string.
   */
  const formatSize = (bytes?: number): string => {
    if (bytes === undefined) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Formats a date string into a more readable format.
   * @param {string | undefined} dateString - The date string to format.
   * @returns {string} The formatted date string.
   */
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString; // Return original if parsing fails
    }
  };

  /**
   * Handles the creation of a new file.
   */
  const handleCreateFile = async () => {
    if (!newFileName.trim()) {
      toast.warn('File name cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      await createFile(currentPath, newFileName);
      toast.success(`File "${newFileName}" created successfully.`);
      setNewFileName('');
      setShowNewFileModal(false);
      fetchItems(currentPath); // Refresh the list
    } catch (err: any) {
      console.error('Failed to create file:', err);
      toast.error(`Failed to create file: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the creation of a new folder.
   */
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.warn('Folder name cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      await createFolder(currentPath, newFolderName);
      toast.success(`Folder "${newFolderName}" created successfully.`);
      setNewFolderName('');
      setShowNewFolderModal(false);
      fetchItems(currentPath); // Refresh the list
    } catch (err: any) {
      console.error('Failed to create folder:', err);
      toast.error(`Failed to create folder: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the deletion of a file or folder.
   * @param {FileSystemItem} item - The item to delete.
   */
  const handleDeleteItem = async (item: FileSystemItem) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      return;
    }
    setLoading(true);
    try {
      await deleteItem(item.path);
      toast.success(`"${item.name}" deleted successfully.`);
      fetchItems(currentPath); // Refresh the list
    } catch (err: any) {
      console.error('Failed to delete item:', err);
      toast.error(`Failed to delete "${item.name}": ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the download of a file.
   * @param {FileSystemItem} item - The file item to download.
   */
  const handleDownloadFile = async (item: FileSystemItem) => {
    if (item.is_directory) {
      toast.warn('Cannot download a directory directly.');
      return;
    }
    try {
      toast.info(`Downloading "${item.name}"...`);
      await downloadFile(item.path, item.name);
      toast.success(`"${item.name}" downloaded successfully.`);
    } catch (err: any) {
      console.error('Failed to download file:', err);
      toast.error(`Failed to download "${item.name}": ${err.message}`);
    }
  };

  /**
   * Handles file selection for upload.
   * @param {ChangeEvent<HTMLInputElement>} event - The change event from the file input.
   */
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  /**
   * Handles the file upload process.
   */
  const handleUploadFile = async () => {
    if (!selectedFile) {
      toast.warn('No file selected for upload.');
      return;
    }

    setIsUploading(true);
    try {
      await uploadFile(currentPath, selectedFile);
      toast.success(`File "${selectedFile.name}" uploaded successfully.`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear the file input
      }
      fetchItems(currentPath); // Refresh the list
    } catch (err: any) {
      console.error('Failed to upload file:', err);
      toast.error(`Failed to upload file: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Initiates the rename process for an item.
   * @param {FileSystemItem} item - The item to rename.
   */
  const startRename = (item: FileSystemItem) => {
    setRenameItemPath(item.path);
    setRenameItemName(item.name);
  };

  /**
   * Handles the renaming of a file or folder.
   * @param {FileSystemItem} originalItem - The original item object.
   */
  const handleRenameItem = async (originalItem: FileSystemItem) => {
    if (!renameItemName.trim() || renameItemName === originalItem.name) {
      setRenameItemPath(null); // Cancel rename if name is empty or unchanged
      return;
    }

    setLoading(true);
    try {
      const oldPath = originalItem.path;
      const newPath = `${currentPath}/${renameItemName}`; // Construct new path based on current directory
      await renameItem(oldPath, newPath);
      toast.success(`"${originalItem.name}" renamed to "${renameItemName}" successfully.`);
      setRenameItemPath(null);
      setRenameItemName('');
      fetchItems(currentPath); // Refresh the list
    } catch (err: any) {
      console.error('Failed to rename item:', err);
      toast.error(`Failed to rename "${originalItem.name}": ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 relative overflow-hidden h-full flex flex-col" data-aos="fade-up">
      <h2 className="text-2xl font-bold mb-4 text-jarvis-500 flex items-center">
        <i className="fas fa-folder mr-3"></i> File Manager
      </h2>

      {/* Current Path & Navigation */}
      <div className="flex items-center space-x-2 mb-4 text-sm text-jarvis-400">
        <Button
          onClick={handleGoBack}
          disabled={currentPath === '/'}
          variant="ghost"
          size="sm"
          className="px-2 py-1 bg-jarvis-gray-700 hover:bg-jarvis-gray-600 transition-colors rounded-md"
        >
          <i className="fas fa-arrow-left mr-1"></i> Back
        </Button>
        <span className="font-mono text-jarvis-accent-400">{currentPath}</span>
      </div>

      {/* File Operations */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={() => setShowNewFileModal(true)} className="bg-jarvis-accent-500 hover:bg-jarvis-accent-600 transition-colors">
          <i className="fas fa-file-alt mr-2"></i> New File
        </Button>
        <Button onClick={() => setShowNewFolderModal(true)} className="bg-jarvis-accent-500 hover:bg-jarvis-accent-600 transition-colors">
          <i className="fas fa-folder-plus mr-2"></i> New Folder
        </Button>

        {/* Upload File Section */}
        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden" // Hide the default input
            id="file-upload-input"
          />
          <label
            htmlFor="file-upload-input"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium
                       bg-jarvis-blue-500 hover:bg-jarvis-blue-600 transition-colors
                       h-10 px-4 py-2 cursor-pointer text-white"
          >
            <i className="fas fa-upload mr-2"></i> Select File
          </label>
          {selectedFile && <span className="text-jarvis-400 text-sm">{selectedFile.name}</span>}
          <Button
            onClick={handleUploadFile}
            disabled={!selectedFile || isUploading}
            className="bg-jarvis-green-500 hover:bg-jarvis-green-600 transition-colors"
          >
            {isUploading ? <><i className="fas fa-spinner fa-spin mr-2"></i> Uploading...</> : <><i className="fas fa-cloud-upload-alt mr-2"></i> Upload</>}
          </Button>
        </div>
      </div>

      {/* Modals for New File/Folder */}
      {(showNewFileModal || showNewFolderModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-jarvis-500">
              {showNewFileModal ? 'Create New File' : 'Create New Folder'}
            </h3>
            <input
              type="text"
              className="w-full p-2 mb-4 bg-jarvis-gray-800 border border-jarvis-gray-600 rounded-md text-jarvis-300 focus:outline-none focus:ring-2 focus:ring-jarvis-accent-500"
              placeholder={showNewFileModal ? 'Enter file name (e.g., my_document.txt)' : 'Enter folder name (e.g., New Folder)'}
              value={showNewFileModal ? newFileName : newFolderName}
              onChange={(e) => (showNewFileModal ? setNewFileName(e.target.value) : setNewFolderName(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  showNewFileModal ? handleCreateFile() : handleCreateFolder();
                }
              }}
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => {
                  setShowNewFileModal(false);
                  setShowNewFolderModal(false);
                  setNewFileName('');
                  setNewFolderName('');
                }}
                variant="outline"
                className="hover:bg-jarvis-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={showNewFileModal ? handleCreateFile : handleCreateFolder}
                className="bg-jarvis-accent-500 hover:bg-jarvis-accent-600"
                disabled={loading}
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : showNewFileModal ? 'Create File' : 'Create Folder'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* File List */}
      <div className="flex-grow overflow-auto border border-jarvis-gray-700 rounded-lg bg-jarvis-gray-900 p-2">
        {loading && (
          <div className="text-jarvis-400 text-center py-8">
            <i className="fas fa-spinner fa-spin text-3xl mb-2"></i>
            <p>Loading items...</p>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center py-8">
            <i className="fas fa-exclamation-triangle text-3xl mb-2"></i>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-jarvis-500 text-center py-8">
            <i className="fas fa-box-open text-3xl mb-2"></i>
            <p>No items found in this directory.</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <table className="min-w-full text-left text-jarvis-300">
            <thead>
              <tr className="border-b border-jarvis-gray-700 text-jarvis-500 uppercase text-xs">
                <th className="p-3">Name</th>
                <th className="p-3 w-24">Type</th>
                <th className="p-3 w-24 text-right">Size</th>
                <th className="p-3 w-48">Last Modified</th>
                <th className="p-3 w-48 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.path} className="border-b border-jarvis-gray-800 hover:bg-jarvis-gray-700 transition-colors group">
                  <td className="p-3 flex items-center">
                    <i
                      className={cn(
                        'mr-3 text-lg',
                        item.is_directory ? 'fas fa-folder text-jarvis-accent-500' : 'fas fa-file-alt text-jarvis-blue-400'
                      )}
                    ></i>
                    {renameItemPath === item.path ? (
                      <input
                        type="text"
                        value={renameItemName}
                        onChange={(e) => setRenameItemName(e.target.value)}
                        onBlur={() => handleRenameItem(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameItem(item);
                          }
                          if (e.key === 'Escape') {
                            setRenameItemPath(null); // Cancel rename
                          }
                        }}
                        className="bg-jarvis-gray-800 border border-jarvis-gray-600 rounded-md p-1 text-sm focus:outline-none focus:ring-1 focus:ring-jarvis-accent-500"
                        autoFocus
                      />
                    ) : (
                      <span
                        className={cn(
                          item.is_directory ? 'cursor-pointer hover:underline text-jarvis-blue-300' : 'text-jarvis-300',
                          'flex-grow'
                        )}
                        onClick={() => item.is_directory && handleOpenFolder(item.name)}
                      >
                        {item.name}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-jarvis-400 text-xs">
                    {item.is_directory ? 'Directory' : 'File'}
                  </td>
                  <td className="p-3 text-right text-jarvis-400 text-xs">
                    {formatSize(item.size)}
                  </td>
                  <td className="p-3 text-jarvis-400 text-xs">
                    {formatDate(item.last_modified)}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!item.is_directory && (
                        <Button
                          onClick={() => handleDownloadFile(item)}
                          variant="ghost"
                          size="sm"
                          className="text-jarvis-green-400 hover:text-jarvis-green-300 hover:bg-jarvis-gray-700 p-1"
                          title="Download"
                        >
                          <i className="fas fa-download"></i>
                        </Button>
                      )}
                      <Button
                        onClick={() => startRename(item)}
                        variant="ghost"
                        size="sm"
                        className="text-jarvis-blue-400 hover:text-jarvis-blue-300 hover:bg-jarvis-gray-700 p-1"
                        title="Rename"
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button
                        onClick={() => handleDeleteItem(item)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-400 hover:bg-jarvis-gray-700 p-1"
                        title="Delete"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
};

export default FileManager;