import { portfolio } from '@frontend/content/portfolio';
import '@frontend/styles/process-flow.css';

const steps = [
    { title: 'Understand', description: 'Clarify the goal, audience, requirements, and constraints.' },
    { title: 'Map', description: 'Organize the content and outline the user’s journey.' },
    { title: 'Design', description: 'Shape the layout, visual hierarchy, and interactions.' },
    { title: 'Build', description: 'Turn the design into a responsive, working interface.' },
    { title: 'Refine', description: 'Check usability, fix issues, and polish the details.' },
];

export function ProcessFlow() {
    const c = portfolio.process;

    return (
        <section className="flow-process" aria-labelledby="process-title">
            <header className="flow-process__heading">
                <p className="flow-kicker">Process / From idea to interface</p>
                <h2 id="process-title">{c.title}</h2>
                <p>{c.intro}</p>
            </header>
            <ol className="flow-process__cards">
                {steps.map((step, index) => (
                    <li key={step.title}>
                        <span className="flow-process__number">{String(index + 1).padStart(2, '0')}</span>
                        <h3>{step.title}</h3>
                        <p>{step.description}</p>
                    </li>
                ))}
            </ol>
        </section>
    );
}
