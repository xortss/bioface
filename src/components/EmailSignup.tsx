import React from 'react';

export const EmailSignup: React.FC = () => {
  return (
    <section className="w-full max-w-2xl mx-auto mt-16 bg-white p-8 rounded-2xl shadow-lg border border-stone-200/80">
      <h3 className="font-semibold text-2xl text-center text-stone-800">Stay Updated</h3>
      <p className="text-center text-stone-600 mt-2 mb-6">Join our mailing list for the latest updates and features.</p>
      <div className="flex justify-center">
        <iframe
          src="https://bioface.substack.com/embed"
          width="480"
          height="320"
          style={{ border: '1px solid #EEE', background: 'white' }}
          frameBorder="0"
          scrolling="no"
          className="max-w-full"
        ></iframe>
      </div>
    </section>
  );
};