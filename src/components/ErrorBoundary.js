import React from 'react';
import '../common/FlexBox.css'

class ErrorBoundary extends React.Component {

    state = { };

    static getDerivedStateFromError(error) {
        return { error: true };
    }

    componentDidCatch(error, info) {
        console.error(error, info);
    }

    render() {
        const { error } = this.state,
            { children } = this.props;

        if (error || !children || children.length === 0) {
            return <div className='flex full-width full-v-height justify-content-center align-items-center'>
                Ups! This is an error... The app will reboot in a few seconds, reload manually if not.
            </div>;
        }

        return children;
    }
}

export default ErrorBoundary;
