document.addEventListener('DOMContentLoaded', () => {
  // 1. Auth Routing Validation
  const token = localStorage.getItem('visioncraft_jwt_token');
  if (!token) {
    window.location.href = '/';
    return;
  }

  // Display user's name
  const userName = localStorage.getItem('visioncraft_user_name') || 'Innovator';
  const usernameDisplay = document.getElementById('username-display');
  if (usernameDisplay) {
    usernameDisplay.textContent = userName;
  }

  // 2. DOM Elements
  const logoutBtn = document.getElementById('logout-btn');
  const craftNewBtn = document.getElementById('craft-new-btn');
  
  const projectsListContainer = document.getElementById('projects-list');
  const selectedProjectTitle = document.getElementById('selected-project-title');
  const detailsEmpty = document.getElementById('details-empty');
  const detailsContent = document.getElementById('details-content');

  // Hub Header Elements
  const hubProjectEmoji = document.getElementById('hub-project-emoji');
  const hubProjectTitle = document.getElementById('hub-project-title');
  const hubProjectDesc = document.getElementById('hub-project-desc');

  // Panel Elements
  const hubSummary = document.getElementById('hub-summary');
  const hubAudience = document.getElementById('hub-audience');
  const hubProblem = document.getElementById('hub-problem');
  const hubTechList = document.getElementById('hub-tech-list');
  const hubSchema = document.getElementById('hub-schema');
  const hubMarketingList = document.getElementById('hub-marketing-list');

  // Tab Buttons & Panels
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  // 3. Mock Project Data
  const projects = [
    {
      emoji: "🏋️",
      title: "AI Fitness Coach",
      date: "Created on 7/4/2026",
      desc: "An AI fitness coach app that analyzes posture via camera and builds custom workout plans for home workouts.",
      tags: ["Mobile App", "AI Camera"],
      summary: "A digital-first coaching tool targeting busy professionals who lack correct fitness forms. Uses Pose Net for posture detection.",
      audience: "Busy professionals aged 25-40 who work from home and need quick, guided form checks.",
      problem: "Preventing injury and accelerating fitness gains through real-time posture check feedbacks.",
      tech: [
        "Frontend: React Native / Expo",
        "Computer Vision: MediaPipe Pose Detection",
        "Backend: FastAPI / Python",
        "Deployment: Render + AWS S3"
      ],
      schema: "User: { id, name, email, workout_history: [] }\nWorkoutSession: { id, user_id, exercise_type, accuracy_score, duration }",
      marketing: [
        { platform: "LinkedIn", text: "Excited to introduce our vision for an AI Fitness Coach! Perfect form, right in your living room. No pricey trainers needed. 🚀 #FitnessTech #AI" },
        { platform: "Twitter", text: "Work from home causing back pain? 💻🏋️ Our camera-based pose tracker acts as a virtual trainer, ensuring you do exercises with perfect posture. Join the waitlist!" }
      ]
    },
    {
      emoji: "📅",
      title: "Freelancer Billing",
      date: "Created on 7/4/2026",
      desc: "Automated micro-SaaS billing and invoicing solution for freelance writers and designers to collect quick payments.",
      tags: ["Micro-SaaS", "Invoicing"],
      summary: "Invoicing software designed to help freelancers track client billing hours, automatically generate beautiful PDFs, and chase late payments with scheduled email reminders.",
      audience: "Independent freelancers, creative gig workers, and contractors working with monthly retainer clients.",
      problem: "Spending hours manually tracking client hours, generating invoices, and chasing late payments.",
      tech: [
        "Frontend: React.js (Vite)",
        "Database: PostgreSQL",
        "Payment Gateway: Stripe Integration",
        "Backend: Node.js / Express"
      ],
      schema: "Invoice: { id, client_email, amount, status: 'paid'|'pending', due_date }\nTimeLog: { id, description, hours_spent, hourly_rate }",
      marketing: [
        { platform: "LinkedIn", text: "Freelancers, stop chasing payments. 📅 Connect Stripe, configure reminders, and automate invoices in under 5 minutes. Spend time building, not billing! #SaaS #Freelance" },
        { platform: "Twitter", text: "I built a small tool to help myself invoice clients instantly. It automatically sends email warnings for late payments. Check out the Freelancer Billing blueprint! 💸" }
      ]
    },
    {
      emoji: "🍲",
      title: "Food Sharing Platform",
      date: "Created on 7/3/2026",
      desc: "A hyperlocal food sharing platform matching local grocers and households with excess food to neighbors in need.",
      tags: ["Hyperlocal", "Sustainability"],
      summary: "A social impact platform targeting food waste by matching restaurants and grocery chains with surplus food to charities, food shelters, and low-income households in the same zip code.",
      audience: "Environmentally-conscious neighbors, local food banks, grocery stores, and neighborhood shelters.",
      problem: "Massive amounts of edible food go to waste daily while others face food insecurity.",
      tech: [
        "Frontend: React Native Mobile Web",
        "Database: MongoDB (Geospatial index)",
        "Notifications: Firebase Cloud Messaging",
        "Backend: Flask / Python"
      ],
      schema: "FoodDonation: { id, donor_id, food_item, quantity, pickup_time, status }\nClaim: { id, donation_id, recipient_id, claimed_at }",
      marketing: [
        { platform: "LinkedIn", text: "Reducing food waste is a local problem with a local solution. We're launching a matching algorithm linking grocers to nearby food banks. Join our pilot scheme! 🍲 #Sustainability #SocialImpact" },
        { platform: "Twitter", text: "Don't let edible food end up in landfills. 🌎 Our geospatial tracker connects households with excess food directly to their neighbors. Simple. Free. Hyperlocal. 🍲" }
      ]
    }
  ];

  // 4. Logout Action
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('visioncraft_jwt_token');
    localStorage.removeItem('visioncraft_user_name');
    
    // Smooth transition back to login page
    document.body.style.opacity = 0;
    document.body.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      window.location.href = '/';
    }, 300);
  });

  // Craft New button action (Redirects to dashboard with simple alert for visual feedback)
  craftNewBtn.addEventListener('click', () => {
    alert('This button triggers the Startup Generator wizard on the mobile app. To generate a new startup blueprint, run the Expo app on your mobile device or simulator!');
  });

  // 5. Select and Populate Project
  function selectProject(index) {
    // Remove active class from all items
    const projectItems = document.querySelectorAll('.project-item');
    projectItems.forEach((item, i) => {
      if (i === index) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    const project = projects[index];
    if (!project) return;

    // Show details panel
    detailsEmpty.classList.add('hidden');
    detailsContent.classList.remove('hidden');

    // Populate metadata
    selectedProjectTitle.textContent = `${project.title} Details`;
    hubProjectEmoji.textContent = project.emoji;
    hubProjectTitle.textContent = project.title;
    hubProjectDesc.textContent = project.desc;

    // Populate Blueprint
    hubSummary.textContent = project.summary;
    hubAudience.textContent = project.audience;
    hubProblem.textContent = project.problem;

    // Populate Tech Stack
    hubTechList.innerHTML = '';
    project.tech.forEach(item => {
      const parts = item.split(':');
      const li = document.createElement('li');
      if (parts.length > 1) {
        li.innerHTML = `<strong>${parts[0]}:</strong>${parts.slice(1).join(':')}`;
      } else {
        li.textContent = item;
      }
      hubTechList.appendChild(li);
    });

    // Populate Schema
    hubSchema.textContent = project.schema;

    // Populate Marketing
    hubMarketingList.innerHTML = '';
    project.marketing.forEach(post => {
      const div = document.createElement('div');
      div.className = 'post-item';
      div.innerHTML = `
        <span class="post-platform">${post.platform}</span>
        <p class="post-text">${post.text}</p>
      `;
      hubMarketingList.appendChild(div);
    });
  }

  // 6. Project click listener delegation
  projectsListContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.open-btn');
    const item = e.target.closest('.project-item');
    
    if (btn) {
      const index = parseInt(btn.getAttribute('data-project-index'), 10);
      selectProject(index);
    } else if (item) {
      // Allow clicking the item body to select it too
      const btnInside = item.querySelector('.open-btn');
      if (btnInside) {
        const index = parseInt(btnInside.getAttribute('data-project-index'), 10);
        selectProject(index);
      }
    }
  });

  // 7. Tabs Switching
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Set active tab button
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Show active tab panel
      const targetTab = btn.getAttribute('data-tab');
      tabPanels.forEach(panel => {
        const panelId = panel.getAttribute('id');
        if (panelId === `panel-${targetTab}`) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
    });
  });

  // Auto-select first project by default
  selectProject(0);
});
