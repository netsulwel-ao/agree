-- ============================================
-- Approval Workflows — Múltiplos níveis com regras por valor/risco
-- ============================================

-- 1. Templates de workflow de aprovação
CREATE TABLE IF NOT EXISTS approval_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Passos de aprovação (ordenados)
CREATE TABLE IF NOT EXISTS approval_workflow_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL CHECK (step_order >= 0),
    name TEXT NOT NULL,
    min_value NUMERIC,
    max_value NUMERIC,
    min_risk_level TEXT,
    max_risk_level TEXT,
    required_approvers INTEGER DEFAULT 1 CHECK (required_approvers >= 1),
    UNIQUE (workflow_id, step_order)
);

-- 3. Aprovadores de cada passo
CREATE TABLE IF NOT EXISTS approval_workflow_step_approvers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    step_id UUID NOT NULL REFERENCES approval_workflow_steps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    UNIQUE (step_id, user_id)
);

-- 4. Pedidos de aprovação
CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES approval_workflows(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','approved','rejected')),
    current_step_id UUID REFERENCES approval_workflow_steps(id),
    current_step_order INTEGER,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    completed_at TIMESTAMPTZ
);

-- 5. Aprovações/rejeições individuais
CREATE TABLE IF NOT EXISTS approval_request_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES approval_workflow_steps(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL CHECK (status IN ('approved','rejected')),
    comment TEXT,
    UNIQUE (request_id, step_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_approval_steps_workflow ON approval_workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_approval_approvers_step ON approval_workflow_step_approvers(step_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_contract ON approval_requests(contract_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_created_by ON approval_requests(created_by);

-- RLS
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflow_step_approvers ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_request_approvals ENABLE ROW LEVEL SECURITY;

-- Workflows visíveis para todos os utilizadores autenticados
CREATE POLICY "Authenticated users can view workflows"
    ON approval_workflows FOR SELECT USING (auth.role() = 'authenticated');

-- Apenas admins criam/actualizam/eliminam workflows
CREATE POLICY "Admins can insert workflows"
    ON approval_workflows FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
    );
CREATE POLICY "Admins can update workflows"
    ON approval_workflows FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
    );
CREATE POLICY "Admins can delete workflows"
    ON approval_workflows FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
    );

-- Steps: select all, insert/update/delete only admin
CREATE POLICY "Authenticated users can view steps"
    ON approval_workflow_steps FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage steps"
    ON approval_workflow_steps FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
    );
CREATE POLICY "Admins can update steps"
    ON approval_workflow_steps FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
    );
CREATE POLICY "Admins can delete steps"
    ON approval_workflow_steps FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
    );

-- Approvers: same as steps
CREATE POLICY "Authenticated users can view approvers"
    ON approval_workflow_step_approvers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage approvers"
    ON approval_workflow_step_approvers FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
    );
CREATE POLICY "Admins can update approvers"
    ON approval_workflow_step_approvers FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
    );
CREATE POLICY "Admins can delete approvers"
    ON approval_workflow_step_approvers FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
    );

-- Approval requests: created by user sees own, approvers see assigned
CREATE POLICY "Users can view their own requests"
    ON approval_requests FOR SELECT USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM approval_request_approvals ara
            JOIN approval_workflow_step_approvers awsa ON ara.step_id = awsa.step_id
            WHERE ara.request_id = approval_requests.id AND awsa.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM approval_workflow_step_approvers awsa
            JOIN approval_workflow_steps aws ON awsa.step_id = aws.id
            WHERE aws.workflow_id = approval_requests.workflow_id AND awsa.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create requests"
    ON approval_requests FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own pending requests"
    ON approval_requests FOR UPDATE USING (
        created_by = auth.uid() AND status = 'pending'
    );

-- Approvals: users see their own, admins see all
CREATE POLICY "Users can view their own approvals"
    ON approval_request_approvals FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
    );

CREATE POLICY "Assigned approvers can insert approvals"
    ON approval_request_approvals FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM approval_workflow_step_approvers awsa
            JOIN approval_requests ar ON awsa.step_id = ar.current_step_id
            WHERE ar.id = request_id AND awsa.user_id = auth.uid()
        )
    );

-- Function to check if a step is complete
CREATE OR REPLACE FUNCTION public.check_step_complete(p_request_id UUID, p_step_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_required INTEGER;
    v_approved INTEGER;
BEGIN
    SELECT required_approvers INTO v_required
    FROM approval_workflow_steps WHERE id = p_step_id;

    SELECT COUNT(*) INTO v_approved
    FROM approval_request_approvals
    WHERE request_id = p_request_id AND step_id = p_step_id AND status = 'approved';

    RETURN v_approved >= v_required;
END;
$$;

-- Function to auto-advance to next step or complete
CREATE OR REPLACE FUNCTION public.advance_approval_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_next_order INTEGER;
    v_next_step_id UUID;
    v_max_order INTEGER;
BEGIN
    -- Check if current step is complete
    IF NOT check_step_complete(NEW.request_id, NEW.step_id) THEN
        RETURN NEW;
    END IF;

    -- Get current request
    SELECT current_step_order INTO v_max_order
    FROM approval_requests WHERE id = NEW.request_id;

    -- Find next step
    SELECT id, step_order INTO v_next_step_id, v_next_order
    FROM approval_workflow_steps
    WHERE workflow_id = (SELECT workflow_id FROM approval_requests WHERE id = NEW.request_id)
      AND step_order > v_max_order
    ORDER BY step_order ASC
    LIMIT 1;

    IF v_next_step_id IS NOT NULL THEN
        -- Advance to next step
        UPDATE approval_requests
        SET current_step_id = v_next_step_id,
            current_step_order = v_next_order,
            updated_at = NOW()
        WHERE id = NEW.request_id;
    ELSE
        -- All steps complete — approve
        UPDATE approval_requests
        SET status = 'approved',
            current_step_id = NULL,
            updated_at = NOW(),
            completed_at = NOW()
        WHERE id = NEW.request_id;

        -- Update contract status
        UPDATE contracts SET status = 'approved' WHERE id = (
            SELECT contract_id FROM approval_requests WHERE id = NEW.request_id
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_advance_approval
    AFTER INSERT ON approval_request_approvals
    FOR EACH ROW
    EXECUTE FUNCTION advance_approval_request();

-- Function to reject request
CREATE OR REPLACE FUNCTION public.reject_approval_request(p_request_id UUID, p_user_id UUID, p_comment TEXT DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE approval_requests
    SET status = 'rejected',
        updated_at = NOW(),
        completed_at = NOW()
    WHERE id = p_request_id;

    UPDATE contracts SET status = 'rejected' WHERE id = (
        SELECT contract_id FROM approval_requests WHERE id = p_request_id
    );
END;
$$;
