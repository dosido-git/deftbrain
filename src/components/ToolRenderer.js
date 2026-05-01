import React, { lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tools } from '../data/tools'; 
import ToolPageWrapper from './ToolPageWrapper'; 
import { useDocumentHead } from '../hooks/useDocumentHead';

const ToolRenderer = ({ college }) => {
  const { toolId } = useParams();
  const navigate = useNavigate();
  
  const toolData = tools.find(i => i.id === toolId);

  useDocumentHead({
    title: toolData?.title,
    description: toolData?.description,
    canonicalPath: toolId ? `/${toolId}` : undefined,
    toolId: toolId,
  });

  const ToolComponent = lazy(() => 
    import(`../tools/${toolId}.js`).catch(() => ({
      default: () => (
        <div className="p-20 text-center text-slate-500 italic font-mono uppercase tracking-widest">
          [ Error: Intelligence Component Missing in /tools/ ]
        </div>
      )
    }))
  );

  if (!toolData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-6 bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 max-w-sm w-full">
          <h1 className="text-6xl font-black text-slate-900 italic tracking-tighter">404</h1>
          <div>
            <p className="text-blue-600 font-mono text-xs tracking-[.4em] uppercase font-bold">Tool Not Found</p>
            <p className="text-slate-400 text-sm mt-2">This tool may have been renamed or retired. The dashboard has the current list.</p>
          </div>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-colors shadow-lg shadow-slate-200"
          >
            Back to DashBoard
          </button>
        </div>
      </div>
    );
  }

  return (
    <ToolPageWrapper 
      tool={toolData}
      toolId={toolId}
    >
      <Suspense fallback={
        <div className="p-20 flex flex-col items-center justify-center space-y-4">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-blue-600 font-mono text-[10px] tracking-widest uppercase">Decrypting Asset...</p>
        </div>
      }>
<ToolComponent college={college} tool={toolData} />
      </Suspense>
    </ToolPageWrapper>
  );
};

export default ToolRenderer;
