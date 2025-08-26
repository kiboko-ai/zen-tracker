import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import styles from '../styles/PrivacyPolicy.module.css'

export default function PrivacyPolicy() {
  const router = useRouter()
  const [content, setContent] = useState('')

  useEffect(() => {
    // Fetch the markdown content
    fetch('/content/privacy-policy.md')
      .then(res => res.text())
      .then(text => {
        // Convert markdown to HTML (basic conversion)
        const html = text
          .replace(/^### (.*$)/gim, '<h3>$1</h3>')
          .replace(/^## (.*$)/gim, '<h2>$1</h2>')
          .replace(/^# (.*$)/gim, '<h1>$1</h1>')
          .replace(/^\* (.+)/gim, '<li>$1</li>')
          .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
          .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*)\*/g, '<em>$1</em>')
          .replace(/\n\n/g, '</p><p>')
          .replace(/^/, '<p>')
          .replace(/$/, '</p>')
        setContent(html)
      })
      .catch(err => {
        console.error('Failed to load privacy policy:', err)
        setContent('<p>Privacy policy content not found. Please add privacy-policy.md to the public folder.</p>')
      })
  }, [])

  return (
    <div className={styles.container}>
      <Head>
        <title>Privacy Policy - Zen</title>
        <meta name="description" content="Privacy Policy for Zen - Minimalist Focus Timer App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className={styles.nav}>
        <div className={styles.navContainer}>
          <div className={styles.logo} onClick={() => router.push('/')}>Zen</div>
          <button className={styles.backButton} onClick={() => router.push('/')}>
            Back to Home
          </button>
        </div>
      </nav>

      <main className={styles.main}>
        <div 
          className={styles.content} 
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2025 Zen. All rights reserved.</p>
      </footer>
    </div>
  )
}