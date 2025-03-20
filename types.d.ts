// Google One Tap type definitions
interface CredentialResponse {
  credential: string;
  select_by: string;
  client_id: string;
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: any) => void;
        prompt: (callback?: (notification: any) => void) => void;
        renderButton: (parent: HTMLElement, options: any) => void;
        cancel: () => void;
      };
    };
  };
}