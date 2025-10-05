import React, { useState,useContext } from 'react';
import { ChevronDown, ChevronUp, File, Image, FileText } from 'lucide-react';
import { AppContext } from '../context/AppContext.jsx'
import { deleteDoc, doc, updateDoc, getDoc, arrayRemove } from 'firebase/firestore'
import {db} from '.././config/firebase'
import {toast} from 'react-toastify'
export default function UserProfilePanel({onClose}) {
  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const {chatUser, userData, setChatUser} = useContext(AppContext)

  const files = [
    { id: 1, name: 'Project_Proposal.pdf', type: 'pdf', size: '2.4 MB' },
    { id: 2, name: 'Design_Mockup.png', type: 'image', size: '1.8 MB' },
    { id: 3, name: 'Meeting_Notes.txt', type: 'text', size: '45 KB' },
    { id: 4, name: 'Budget_Sheet.pdf', type: 'pdf', size: '890 KB' },
  ];

  const getFileIcon = (type) => {
    switch(type) {
      case 'image': return <Image className="w-4 h-4 text-blue-500" />;
      case 'pdf': return <FileText className="w-4 h-4 text-red-500" />;
      default: return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleUnfriend = async(friendId) => {
    try{
        const chatRefMe = doc(db,'chats',userData.id);
        const chatRefFriend = doc(db, "chats", friendId);

        const mySnap = await getDoc(chatRefMe);
        const myChats= mySnap.data()?.chatsData|| [];
        const chatObj= myChats.find(c=> c.rId === friendId);
        
        if(!chatObj){
            toast.error("not found")
        }

        await updateDoc(chatRefMe,{
            chatsData:arrayRemove(chatObj)
        });

        const friendSnap = await getDoc(chatRefFriend);
        const friendChats = friendSnap.data()?.chatsData || [];
        const friendChatObj = friendChats.find(c => c.rId === userData.id);

    if (friendChatObj) {
      await updateDoc(chatRefFriend, {
        chatsData: arrayRemove(friendChatObj)
      });
    }

    // optionally delete messages doc (so it doesn’t sit around unused)
    if (chatObj.messageId) {
      await deleteDoc(doc(db, "messages", chatObj.messageId));
    }
     setChatUser(null);
    console.log("Friend removed successfully!");
    toast.success("Friend removed successfully!");

    }catch(error){
        toast.error('error')
    }
    }


  return (
    <div className="w-80 h-screen bg-white border-l border-gray-200 flex flex-col">
      {/* Header with Avatar and Name */}
      <div className="p-6 flex flex-col items-center border-b border-gray-200">
        <img src={chatUser.userData?.avatar}  className="w-20 h-20 rounded-full mb-3"/>
        <h2 className="text-lg font-semibold text-gray-900">{chatUser.userData?.name} </h2>
        <p className="text-sm text-gray-500">Active now</p>
        <button onClick={onClose}> close </button>
      </div>

      {/* Files Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-gray-200">
          <button
            onClick={() => setIsFilesOpen(!isFilesOpen)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-900">Shared Files</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{files.length}</span>
              {isFilesOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </button>
          
          {isFilesOpen && (
            <div className="px-6 pb-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 py-2 hover:bg-gray-50 rounded px-2 cursor-pointer transition-colors"
                >
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{file.size}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Unfriend Button */}
      <div className="p-6 border-t border-gray-200">
        <button
          onClick={()=>handleUnfriend(chatUser.userData.id)}
          className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
        >
          Unfriend
        </button>
      </div>
    </div>
  );
}