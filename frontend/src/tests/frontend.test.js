/**
 * Frontend Test Suite — Recipe Community
 * React component + integration tests
 */

// ─── Setup mocks ────────────────────────────────────────────────────────────
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => '/',
}));
// 
jest.mock('@/lib/api', () => ({
  authAPI: { me: jest.fn(), login: jest.fn(), register: jest.fn(), updateProfile: jest.fn() },
  recipesAPI: { getAll: jest.fn(), getOne: jest.fn(), create: jest.fn(), delete: jest.fn(), like: jest.fn(), save: jest.fn(), byUser: jest.fn() },
  commentsAPI: { getByRecipe: jest.fn(), create: jest.fn(), delete: jest.fn(), like: jest.fn(), update: jest.fn() },
  categoriesAPI: { getAll: jest.fn() },
  tagsAPI: { getAll: jest.fn() },
  usersAPI: { getSaved: jest.fn(), getProfile: jest.fn() },
}));

jest.mock('@/lib/ws', () => ({
  useRecipeWS: () => ({ broadcastNewComment: jest.fn(), broadcastDeleteComment: jest.fn() }),
}));

const React = require('react');
const { render, screen, fireEvent, waitFor, act } = require('@testing-library/react');

// ─── Mock AuthContext ────────────────────────────────────────────────────────
const mockAuth = {
  user: null,
  loading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  updateUser: jest.fn(),
};

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }) => children,
}));

// ─── 1. Test: Login form renders correctly ───────────────────────────────────
describe('LoginPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('renders email and password fields', () => {
    const LoginPage = require('@/app/auth/login/page').default;
    render(<LoginPage />);
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your password/i)).toBeInTheDocument();
  });

  test('renders sign in button', () => {
    const LoginPage = require('@/app/auth/login/page').default;
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('shows error on failed login', async () => {
    const { authAPI } = require('@/lib/api');
    authAPI.login.mockRejectedValue(new Error('Invalid credentials'));
    mockAuth.login = jest.fn().mockRejectedValue(new Error('Invalid credentials'));

    const LoginPage = require('@/app/auth/login/page').default;
    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: 'bad@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/your password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});

// ─── 2. Test: Register form ───────────────────────────────────────────────────
describe('RegisterPage', () => {
  test('renders all register fields', () => {
    const RegisterPage = require('@/app/auth/register/page').default;
    render(<RegisterPage />);
    expect(screen.getByPlaceholderText(/your_username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/min\. 6 characters/i)).toBeInTheDocument();
  });

  test('shows error for short password', async () => {
    const RegisterPage = require('@/app/auth/register/page').default;
    render(<RegisterPage />);

    fireEvent.change(screen.getByPlaceholderText(/your_username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/min\. 6 characters/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });
  });
});

// ─── 3. Test: Navbar renders for guest ───────────────────────────────────────
describe('Navbar', () => {
  test('shows Login and Sign Up for unauthenticated user', () => {
    mockAuth.user = null;
    const Navbar = require('@/components/Navbar/Navbar').default;
    render(<Navbar />);
    expect(screen.getByText(/login/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });

  test('shows RecipeCommunity logo', () => {
    const Navbar = require('@/components/Navbar/Navbar').default;
    render(<Navbar />);
    expect(screen.getByText(/RecipeCommunity/i)).toBeInTheDocument();
  });
});

// ─── 4. Test: Navbar for authenticated user ───────────────────────────────────
describe('Navbar (authenticated)', () => {
  test('shows Recipes and Add Recipe links when logged in', () => {
    mockAuth.user = { _id: '123', username: 'chef_mario', email: 'mario@test.com', avatar: '' };
    const Navbar = require('@/components/Navbar/Navbar').default;
    render(<Navbar />);
    expect(screen.getByText(/recipes/i)).toBeInTheDocument();
  });
});

// ─── 5. Test: Favorites page - empty state ────────────────────────────────────
describe('FavoritesPage', () => {
  test('shows empty state when no saved recipes', async () => {
    mockAuth.user = { _id: 'user1', username: 'tester', email: 'test@test.com' };
    const { usersAPI } = require('@/lib/api');
    usersAPI.getSaved.mockResolvedValue([]);

    const FavoritesPage = require('@/app/favorites/page').default;
    await act(async () => { render(<FavoritesPage />); });

    await waitFor(() => {
      expect(screen.getByText(/no saved recipes yet/i)).toBeInTheDocument();
    });
  });

  test('shows saved recipes when present', async () => {
    mockAuth.user = { _id: 'user1', username: 'tester', email: 'test@test.com' };
    const { usersAPI } = require('@/lib/api');
    usersAPI.getSaved.mockResolvedValue([
      { _id: 'r1', title: 'Pasta Carbonara', description: 'Classic Italian pasta', difficulty: 'medium', cookingTime: 30, likesCount: 5, image: '', author: { username: 'chef', avatar: '' }, tags: [] }
    ]);

    const FavoritesPage = require('@/app/favorites/page').default;
    await act(async () => { render(<FavoritesPage />); });

    await waitFor(() => {
      expect(screen.getByText(/Pasta Carbonara/i)).toBeInTheDocument();
    });
  });
});
