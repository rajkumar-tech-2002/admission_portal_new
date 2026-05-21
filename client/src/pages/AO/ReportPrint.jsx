import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import RecordReport from '../../components/layout/RecordReport';
import { useNavigate } from 'react-router-dom';
import useIdleTimer from '../../hooks/useIdleTimer';
import { secureLogout } from '../../utils/auth';

const ReportPrint = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Initialize Idle Timer (15 minutes)
    useIdleTimer(() => secureLogout(navigate), 15 * 60 * 1000);

    useEffect(() => {
        // Set document title to a space to hide browser headers
        const originalTitle = document.title;
        document.title = " ";

        const timer = setTimeout(() => {
            window.print();
        }, 1500);

        return () => {
            clearTimeout(timer);
            document.title = originalTitle;
        };
    }, []);

    return (
        <div style={{ background: '#fff', minHeight: '100vh' }}>
            <RecordReport recordId={id} standalone={true} />
        </div>
    );
};

export default ReportPrint;
