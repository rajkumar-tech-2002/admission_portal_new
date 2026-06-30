import toast from 'react-hot-toast';

export const showToast = {
    success: (msg) => toast.success(msg),
    error: (msg) => toast.error(msg),
    info: (msg) => toast(msg, { icon: 'ℹ️' }),
    loading: (msg) => toast.loading(msg),
    dismiss: () => toast.dismiss(),
};

// Simple confirm replacement using toast (non-blocking, so needs callback)
export const confirmAction = (message, onConfirm) => {
    toast((t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontWeight: 500 }}>{message}</span>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button 
                    onClick={() => toast.dismiss(t.id)}
                    style={{
                        padding: '4px 12px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0',
                        background: '#fff',
                        cursor: 'pointer'
                    }}
                >
                    Cancel
                </button>
                <button 
                    onClick={() => {
                        toast.dismiss(t.id);
                        onConfirm();
                    }}
                    style={{
                        padding: '4px 12px',
                        borderRadius: '4px',
                        border: 'none',
                        background: '#1e3a8a',
                        color: '#fff',
                        cursor: 'pointer'
                    }}
                >
                    Confirm
                </button>
            </div>
        </div>
    ), {
        duration: 10000,
        position: 'top-center',
    });
};
